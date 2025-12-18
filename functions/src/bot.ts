import { Bot, Context, InputFile } from 'grammy';
import { generateCard } from './generator/card';
import { CommandLogService, GroupService } from './services/db';
import { getStockData } from './services/stock';
import { getWeatherData } from './services/weather';

// Ensure you set this environment variable in Firebase Functions
// firebase functions:secrets:set TELEGRAM_BOT_TOKEN
const token = process.env.TELEGRAM_BOT_TOKEN || '';

if (!token) {
    console.warn('Warning: TELEGRAM_BOT_TOKEN is not set');
}

export const bot = new Bot(token);

// Centralized help message
const HELP_MESSAGE = `
👋 *Welcome! Here is what I can do:*
Need to check the markets or the sky? Just type a command below:

💵 *Check Stock Prices*
      Usage: \`$<TICKER>\`
      Try: \`$AAPL\` or \`$MSFT $NVDA\`

☔ *Check the Weather*
      Usage: \`Weather <City>\`
      Try: \`Weather Tokyo\` or \`Weather Paris\`

⚙️ *Settings*
      /start — Resume bot activity
      /stop — Mute all notifications
      /help — Redisplay this guide
`;

bot.catch((err) => {
    console.error('Error in bot interaction:', err);
});

// Middleware: Check if bot interactions are allowed in this group
bot.use(async (ctx, next) => {
    // Only check active status for group chats (direct messages are always allowed)
    if (ctx.chat && ctx.chat.id < 0) {
        try {
            const isActive = await GroupService.isGroupActive(ctx.chat.id);

            // Pass-through specific info commands even if "stopped", 
            // to specifically allow /start to work. 
            // Logic: if stopped, we block everything EXCEPT /start.
            if (!isActive) {
                const text = ctx.message?.text || '';
                // If inactive, only allow /start command to proceed (to re-activate)
                if (!text.startsWith('/start')) {
                    return; // Silently ignore
                }
            }
        } catch (error) {
            console.error('Error in GroupMiddleware:', error);
            // Optionally allow traffic if DB fails to avoid blocking everyone
        }
    }

    await next();
});

// Helper: Fetch details and register group. Returns true if active, false if blocked.
async function registerGroup(ctx: Context): Promise<boolean> {
    const chat = ctx.chat;
    if (!chat || chat.id >= 0) return true; // Ignore DMs - always "active"

    try {
        const [fullChat, memberCount] = await Promise.all([
            ctx.api.getChat(chat.id),
            ctx.api.getChatMemberCount(chat.id)
        ]);

        const isActive = await GroupService.addGroup(chat.id, chat.title || 'Unknown Group', {
            type: chat.type,
            username: chat.username || undefined,
            description: fullChat.description || undefined,
            memberCount: memberCount
        });

        if (!isActive) {
            return false; // BLOCKED
        }

        return true;
    } catch (e) {
        console.error('Failed to fetch group details:', e);
        // Fallback
        const isActive = await GroupService.addGroup(chat.id, chat.title || 'Unknown Group', {
            type: chat.type,
            username: chat.username || undefined
        });
        return isActive;
    }
}

// Event: Bot added/removed from group
bot.on('my_chat_member', async (ctx) => {
    const status = ctx.myChatMember.new_chat_member.status;
    const chat = ctx.chat;

    if (status === 'member' || status === 'administrator') {
        // Bot joined or promoted
        const isActive = await registerGroup(ctx);
        if (!isActive) {
            await ctx.reply('🚫 This group has been banned by platform administrators. The bot will not respond.');
            return;
        }
        await ctx.reply('Hello! I am now tracking stock and weather commands in this group. 📈🌤️');
    } else if (status === 'left' || status === 'kicked') {
        // Bot left or kicked
        await GroupService.removeGroup(chat.id);
    }
});

// Command: /start - Activate bot
bot.command('start', async (ctx) => {
    if (ctx.chat.type === 'private') {
        await ctx.reply('Welcome! \n\nCommands:\n- Stock: $AAPL\n- Weather: Weather London');
        return;
    }

    // Register/Update full group details on /start
    const isActive = await registerGroup(ctx);
    if (!isActive) {
        await ctx.reply('🚫 This group has been banned by platform administrators.');
        return;
    }

    // Log explicit start command
    if (ctx.from && ctx.chat) {
        await CommandLogService.logCommand({
            chatId: ctx.chat.id,
            chatTitle: ctx.chat.title || 'Unknown',
            userId: ctx.from.id,
            username: ctx.from.username || ctx.from.first_name,
            command: '/start',
            status: 'success'
        });
    }

    await ctx.reply(
        '✅ Bot started!\n' + HELP_MESSAGE,
        { parse_mode: 'Markdown' }
    );
});

// Command: /help - Show available commands
bot.command('help', async (ctx) => {
    await ctx.reply(HELP_MESSAGE, { parse_mode: 'Markdown' });
});

// Command: /stop - Deactivate bot
bot.command('stop', async (ctx) => {
    if (ctx.chat.type === 'private') return; // Cannot stop logic in DM

    await GroupService.setGroupStatus(ctx.chat.id, false);

    // Log stop command
    if (ctx.from && ctx.chat) {
        await CommandLogService.logCommand({
            chatId: ctx.chat.id,
            chatTitle: ctx.chat.title || 'Unknown',
            userId: ctx.from.id,
            username: ctx.from.username || ctx.from.first_name,
            command: '/stop',
            status: 'success'
        });
    }
    await ctx.reply('🛑 Bot stopped. I will stay silent until you type /start.');
});

// 1. Stock Trigger: $SYMBOL (anywhere in text) - supports multiple symbols
bot.hears(/\$[A-Z]+/gi, async (ctx) => {
    const messageText = ctx.message?.text || '';
    // Extract all unique stock symbols from the message
    const matches = messageText.match(/\$([A-Z]+)/gi) || [];
    const symbols = [...new Set(matches.map(m => m.replace('$', '').toUpperCase()))];

    if (symbols.length === 0) return;

    try {
        // Fetch data for all symbols in parallel
        const stockDataArray = await Promise.all(
            symbols.map(symbol => getStockData(symbol).catch(err => {
                console.error(`Error fetching ${symbol}:`, err);
                return null; // Return null for failed fetches
            }))
        );

        // Track failed symbols for error reporting
        const failedSymbols = symbols.filter((_, i) => stockDataArray[i] === null);

        // Filter out failed fetches and sort alphabetically by symbol
        const validData = stockDataArray
            .filter((data): data is NonNullable<typeof data> => data !== null)
            .sort((a, b) => a.symbol.localeCompare(b.symbol));

        if (validData.length === 0) {
            await ctx.reply(`⚠️ Couldn't find stock data for: ${symbols.join(', ')}\n\nPlease check the ticker symbol(s) and try again.`);
            return;
        }

        // If some symbols failed but others succeeded, notify about failures
        if (failedSymbols.length > 0 && validData.length > 0) {
            await ctx.reply(`⚠️ Couldn't find: ${failedSymbols.join(', ')}`);
        }

        const buffer = await generateCard(
            validData.length === 1
                ? { type: 'stock', stockData: validData[0] }
                : { type: 'multiStock', multiStockData: validData }
        );

        await ctx.replyWithPhoto(new InputFile(buffer));
    } catch (error) {
        console.error('Error in stock handler:', error);
        await ctx.reply(`⚠️ Something went wrong while fetching stock data for: ${symbols.join(', ')}\n\nPlease try again in a moment.`);
    }
});

// 2. Weather Trigger: "Weather City"
bot.hears(/^Weather (.+)$/i, async (ctx) => {
    const city = ctx.match[1];

    if (!city) return;

    try {
        const data = await getWeatherData(city);

        const buffer = await generateCard({
            type: 'weather',
            weatherData: data
        });

        await ctx.replyWithPhoto(new InputFile(buffer));
    } catch (error) {
        console.error('Error fetching weather:', error);
        await ctx.reply(`Could not find weather for "${city}".`);
    }
});
