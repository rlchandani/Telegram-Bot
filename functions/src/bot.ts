import { Bot, InputFile } from 'grammy';
import { getStockData } from './services/stock';
import { getWeatherData } from './services/weather';
import { generateCard } from './generator/card';

// Ensure you set this environment variable in Firebase Functions
// firebase functions:secrets:set TELEGRAM_BOT_TOKEN
const token = process.env.TELEGRAM_BOT_TOKEN || '';

if (!token) {
    console.warn('Warning: TELEGRAM_BOT_TOKEN is not set');
}

export const bot = new Bot(token);

bot.use(async (ctx, next) => {

    await next();
});

// 1. Stock Trigger: $SYMBOL (anywhere in text) - supports multiple symbols
bot.hears(/\$[A-Z]+/gi, async (ctx) => {
    const messageText = ctx.message?.text || '';
    // Extract all unique stock symbols from the message
    const matches = messageText.match(/\$([A-Z]+)/gi) || [];
    const symbols = [...new Set(matches.map(m => m.replace('$', '').toUpperCase()))];

    console.log('Received stock command for symbols:', symbols);

    if (symbols.length === 0) return;

    try {
        // Fetch data for all symbols in parallel
        console.log('Fetching stock data for:', symbols);
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

        console.log('Generating image...');
        const buffer = await generateCard(
            validData.length === 1
                ? { type: 'stock', stockData: validData[0] }
                : { type: 'multiStock', multiStockData: validData }
        );
        console.log('Image generated');

        await ctx.replyWithPhoto(new InputFile(buffer));
        console.log('Reply with photo sent');
    } catch (error) {
        console.error('Error in stock handler:', error);
        await ctx.reply(`⚠️ Something went wrong while fetching stock data for: ${symbols.join(', ')}\n\nPlease try again in a moment.`);
    }
});

// 2. Weather Trigger: "Weather City"
bot.hears(/^Weather (.+)$/i, async (ctx) => {
    const city = ctx.match[1];

    if (!city) return;

    // await ctx.reply(`Fetching weather for ${city}...`);

    try {
        const data = await getWeatherData(city);

        const buffer = await generateCard({
            type: 'weather',
            weatherData: data
        });

        await ctx.replyWithPhoto(new InputFile(buffer));
    } catch (error) {
        console.error(error);
        await ctx.reply(`Could not find weather for "${city}".`);
    }
});

// Help command
bot.command('start', (ctx) => {
    ctx.reply('Welcome! \n\nCommands:\n- Stock: $AAPL\n- Weather: Weather London');
});
