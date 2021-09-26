import _ from "lodash";
import { logger } from "firebase-functions";
import { firebaseConfig } from "../firebase_config";
import { Markup } from "telegraf";
import { RobinhoodWrapper } from "../robinhood_wrapper";
import {
  addExpiringMessage,
  checkIfGroupExist,
  addGroup,
  addUser,
  deRegisteredGroup,
  getPolls,
  addPoll,
  addMentionedTicker,
  addToWatchlist,
  sendReportForWatchlistByPerformanceToGroups,
  getGroupServiceStatus,
  checkIfServiceActiveOnGroup,
  getPinnedMessageWithType
} from "../../orchestrators";
import {
  extractTickerSymbolsFromQuoteCommand,
  extractTickerSymbolsInsideMessageText
} from "../utils";
import { generateHydrationValues } from "../../api/helpers/hydration.helpers";
import { expireIn3Hours } from "../timeUtil";
import { MessageAction } from "../../model/messageAction.model";
import { registerOptions } from "../../model/registerAction.model";
import { flaggedCountries } from "../constant";
import { MessageType } from "../../model/messageType.model";
import { NodeHydrationValues } from "../../api/models/types.hydration";

const RobinhoodWrapperClient = new RobinhoodWrapper(
  firebaseConfig.robinhood.username,
  firebaseConfig.robinhood.password,
  firebaseConfig.robinhood.api_key
);

export const commandStatus = async (ctx: any) => {
  const message = ctx.update.message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  const groupId = message.chat.id;
  const serviceStatus = await getGroupServiceStatus(groupId);
  const replyMessage = Object.keys(serviceStatus).map((serviceName) => `${serviceName} - \`${serviceStatus[serviceName]}\``);
  await _sendMessage(
    ctx,
    "*Service Registration Status:*\n" +
      replyMessage.join("\n") +
      `\nRequested by [${requesterName}](tg://user?id=${requesterId})`
  );
  await addExpiringMessage(
    message.chat.id,
    message.message_id,
    MessageAction.DELETE,
    expireIn3Hours()
  );
};

export const commandRegister = async (ctx: any) => {
  const message = ctx.update.message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  const groupId = message.chat.id;
  const groupType = message.chat.type;
  if (groupType === "group") {
    const groupAdmins = await ctx.getChatAdministrators(groupId);
    const foundGroupAdmins = groupAdmins.filter((admin: any) => admin.user.id === requesterId);
    if (foundGroupAdmins.length > 0) {
      if (!(await checkIfGroupExist(groupId))) {
        await addGroup(
          groupId,
          message.chat,
          message.from.id,
          message.date,
          true
        );
      }
      const registerOptionKeyboard = Markup.inlineKeyboard(registerOptions.map((optionGroup) =>
        optionGroup.map((option) =>
          Markup.button.callback(option.name, option.action))));
      await ctx.reply(
        "Choose from following services:",
        registerOptionKeyboard
      );
    } else {
      await ctx.reply(
        "🚫 Unauthorized Access: Only group admins are permitted this operation.\n\n" +
          `Requested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    }
  } else {
    await ctx.reply(
      `❌ Registration Failed: only groups are allowed to register.\n\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  }
  await addExpiringMessage(
    message.chat.id,
    message.message_id,
    MessageAction.DELETE,
    expireIn3Hours()
  );
};

export const commandDeRegister = async (ctx: any) => {
  const message = ctx.update.message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  const groupId = message.chat.id;
  const groupType = message.chat.type;
  if (groupType === "group") {
    const groupAdmins = await ctx.getChatAdministrators(groupId);
    const foundGroupAdmins = groupAdmins.filter((admin: any) => admin.user.id === requesterId);
    if (foundGroupAdmins.length > 0) {
      if (!(await checkIfGroupExist(groupId))) {
        await addGroup(
          groupId,
          message.chat,
          message.from.id,
          message.date,
          true
        );
      }
      await deRegisteredGroup(groupId);
      await ctx.reply(
        "✅ Request Completed: Group has been removed from all registered services.\n" +
          `Requested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.reply(
        `🚫 Unauthorized Access: Only group admins are permitted this operation.\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    }
  } else {
    await ctx.reply(
      `❌ Deregistered Failed: Only groups are allowed to deregister.\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  }
  await addExpiringMessage(
    message.chat.id,
    message.message_id,
    MessageAction.DELETE,
    expireIn3Hours()
  );
};

export const commandQuote = async (ctx: any) => {
  const message = ctx.update.message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  const tickerSymbols = extractTickerSymbolsFromQuoteCommand(message.text);
  let flaggedCountryList: any[] = [];
  const promises = [];
  if (tickerSymbols.length > 0) {
    const stockListQuote = await generateHydrationValues(tickerSymbols);
    stockListQuote.forEach((stockQuote: NodeHydrationValues) => {
      promises.push(addMentionedTicker(
        message.chat.id,
        message.from.id,
        stockQuote.appendix?.symbol,
        stockQuote.appendix?.tradePrice
      ));
      promises.push(RobinhoodWrapperClient.addToWatchlist(
        firebaseConfig.watchlist.mentioned,
        stockQuote.appendix?.symbol
      ));
    });
    if (
      await checkIfServiceActiveOnGroup(
        message.chat.id,
        "report_flagged_country"
      )
    ) {
      flaggedCountryList = Object.keys(flaggedCountries);
    }
    const notFoundStockList = tickerSymbols.filter((symbol) =>
      !stockListQuote.map((slq: NodeHydrationValues) => slq.appendix?.symbol).includes(symbol));
    const filteredStockListQuote = stockListQuote.filter((stockQuote: NodeHydrationValues) =>
      !flaggedCountryList.includes(stockQuote.appendix?.country));
    const replyMessages = filteredStockListQuote.map((stockQuote: NodeHydrationValues) =>
      stockQuote.appendix?.displayMessageStockQuote);
    let replyMessageText = replyMessages.join("`-------------------------`\n");
    if (notFoundStockList.length > 0) {
      replyMessageText +=
        "\n*Tickers not found:*\n" +
        notFoundStockList.map((t) => `$${t}`).join(", ");
    }
    if (replyMessageText) {
      // To maintain message delivery order, this is not pushed to promise queue
      await _sendMessage(ctx, replyMessageText);
    }

    flaggedCountryList.forEach((countryCode: string) => {
      const header = `*🚨🚨🚨 ${flaggedCountries[countryCode].name} 🚨🚨🚨*\n\n`;
      const footer = `\nRequested by [${requesterName}](tg://user?id=${requesterId})`;
      const flaggedStockListQuote = stockListQuote.filter((stockQuote: NodeHydrationValues) => stockQuote.appendix?.country === countryCode);
      const flaggedReplyMessages = flaggedStockListQuote.map((stockQuote: NodeHydrationValues) => stockQuote.appendix?.displayMessageStockQuote);
      if (flaggedReplyMessages.length > 0) {
        promises.push(_sendMessage(
          ctx,
          header +
              flaggedReplyMessages.join("`-------------------------`\n") +
              footer
        ));
      }
    });
  } else {
    promises.push(_sendMessage(
      ctx,
      "Please provide ticker symbol to track\nExample: /quote TSLA"
    ));
  }
  promises.push(addExpiringMessage(
    message.chat.id,
    message.message_id,
    MessageAction.DELETE,
    expireIn3Hours()
  ));
  await Promise.all(promises);
};

export const commandVsSPY = async (ctx: any) => {
  const message = ctx.update.message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  const tickerSymbols = extractTickerSymbolsFromQuoteCommand(message.text);
  let flaggedCountryList: any[] = [];
  const promises = [];
  if (tickerSymbols.length > 8) {
    promises.push(_sendMessage(ctx, "Error: Max 8 tickers are allowed at a time"));
  } else if (tickerSymbols.length > 0) {
    const stockListQuote = await generateHydrationValues(tickerSymbols);
    stockListQuote.forEach((stockQuote: NodeHydrationValues) => {
      promises.push(addMentionedTicker(
        message.chat.id,
        message.from.id,
        stockQuote.appendix?.symbol,
        stockQuote.appendix?.tradePrice
      ));
      promises.push(RobinhoodWrapperClient.addToWatchlist(
        firebaseConfig.watchlist.mentioned,
        stockQuote.appendix?.symbol
      ));
    });
    if (
      await checkIfServiceActiveOnGroup(
        message.chat.id,
        "report_flagged_country"
      )
    ) {
      flaggedCountryList = Object.keys(flaggedCountries);
    }
    const notFoundStockList = tickerSymbols.filter((symbol) =>
      !stockListQuote.map((slq: NodeHydrationValues) => slq.appendix?.symbol).includes(symbol));
    const filteredStockListQuote = stockListQuote.filter((stockQuote: NodeHydrationValues) =>
      !flaggedCountryList.includes(stockQuote.appendix?.country));
    const replyMessages = filteredStockListQuote.map((stockQuote: NodeHydrationValues) =>
      stockQuote.appendix?.displayMessageStockQuoteVsSPY);
    let replyMessageText = replyMessages.join("`-------------------------`\n");
    if (notFoundStockList.length > 0) {
      replyMessageText +=
        "\n*Tickers not found:*\n" +
        notFoundStockList.map((t) => `$${t}`).join(", ");
    }
    if (replyMessageText) {
      // To maintain message delivery order, this is not pushed to promise queue
      await _sendMessage(ctx, replyMessageText);
    }

    flaggedCountryList.forEach((countryCode) => {
      const header = `*🚨🚨🚨 ${flaggedCountries[countryCode].name} 🚨🚨🚨*\n\n`;
      const footer = `\nRequested by [${requesterName}](tg://user?id=${requesterId})`;
      const flaggedStockListQuote = stockListQuote.filter((stockQuote: NodeHydrationValues) => stockQuote.appendix?.country === countryCode);
      const flaggedReplyMessages = flaggedStockListQuote.map((stockQuote: NodeHydrationValues) => stockQuote.appendix?.displayMessageStockQuoteVsSPY);
      if (flaggedReplyMessages.length > 0) {
        promises.push(_sendMessage(
          ctx,
          header +
              flaggedReplyMessages.join("`-------------------------`\n") +
              footer
        ));
      }
    });
  } else {
    promises.push(_sendMessage(
      ctx,
      "Please provide ticker symbol to track\nExample: /quote TSLA"
    ));
  }
  promises.push(addExpiringMessage(
    message.chat.id,
    message.message_id,
    MessageAction.DELETE,
    expireIn3Hours()
  ));
  await Promise.all(promises);
};

const _sendMessage = async (
  ctx: any,
  messageText: any,
  expire = true,
  expireTime = expireIn3Hours()
) => {
  const replyMessage = await ctx.reply(messageText, {
    parse_mode: "Markdown",
    disable_web_page_preview: true
  });
  if (expire) {
    await addExpiringMessage(
      replyMessage.chat.id,
      replyMessage.message_id,
      MessageAction.DELETE,
      expireTime
    );
  }
};

export const commandSp500Up = async (ctx: any) => {
  const message = ctx.update.message;
  const response = await RobinhoodWrapperClient.getSP500Up();
  if ("results" in response) {
    const results = response.results;
    const tickerSymbols = results.map((s: any) => s.symbol);
    if (tickerSymbols.length > 0) {
      const stockListQuote = await generateHydrationValues(tickerSymbols);
      const replyMessages = stockListQuote.map((stockQuote: NodeHydrationValues) =>
        stockQuote.appendix?.displayMessageStockQuote);
      if (replyMessages.length > 0) {
        await _sendMessage(ctx, replyMessages.join("\n"));
      }
    }
  } else {
    await _sendMessage(
      ctx,
      "Sorry, failed to fetch SP500 up list from server.\nPlease try again after sometime"
    );
  }
  await addExpiringMessage(
    message.chat.id,
    message.message_id,
    MessageAction.DELETE,
    expireIn3Hours()
  );
};

export const commandSp500Down = async (ctx: any) => {
  const message = ctx.update.message;
  const response = await RobinhoodWrapperClient.getSP500Down();
  if ("results" in response) {
    const results = response.results;
    const tickerSymbols = results.map((s: any) => s.symbol);
    if (tickerSymbols.length > 0) {
      const stockListQuote = await generateHydrationValues(tickerSymbols);
      const replyMessages = stockListQuote.map((stockQuote: NodeHydrationValues) =>
        stockQuote.appendix?.displayMessageStockQuote);
      if (replyMessages.length > 0) {
        await _sendMessage(ctx, replyMessages.join("\n"));
      }
    }
  } else {
    await _sendMessage(
      ctx,
      "Sorry, failed to fetch SP500 down list from server.\nPlease try again after sometime"
    );
  }
  await addExpiringMessage(
    message.chat.id,
    message.message_id,
    MessageAction.DELETE,
    expireIn3Hours()
  );
};

export const commandNews = async (ctx: any) => {
  const promises = [];
  const message = ctx.update.message;
  const tickerSymbols = extractTickerSymbolsFromQuoteCommand(message.text);
  if (tickerSymbols.length > 0) {
    tickerSymbols.forEach(async (tickerSymbol) =>
      promises.push(_commandNews(ctx, tickerSymbol)));
  } else {
    await _sendMessage(
      ctx,
      "Please provide ticker symbol to track\nExample: /news TSLA"
    );
  }
  promises.push(addExpiringMessage(
    message.chat.id,
    message.message_id,
    MessageAction.DELETE,
    expireIn3Hours()
  ));
  await Promise.all(promises);
};

const _commandNews = async (ctx: any, tickerSymbol: any) => {
  const response = await RobinhoodWrapperClient.getNews(tickerSymbol);
  if ("results" in response) {
    const replyMessages = response.results.map((s: any, i: any) =>
      `${i + 1}. [${s.title}](${s.url})\n*Source:*\`\`\`${s.source}\`\`\`\n`);
    if (replyMessages.length > 0) {
      await _sendMessage(
        ctx,
        `*Ticker:* ${tickerSymbol}\n` + replyMessages.join("")
      );
    } else {
      await _sendMessage(ctx, `No news found for ${tickerSymbol}`);
    }
  } else {
    await _sendMessage(ctx, `No news found for ${tickerSymbol}`);
  }
};

export const commandWatch = async (ctx: any) => {
  const promises = [];
  const message = ctx.update.message;
  const tickerSymbols = extractTickerSymbolsFromQuoteCommand(message.text);
  if (tickerSymbols.length > 0) {
    const stockListQuote = await generateHydrationValues(tickerSymbols);
    stockListQuote.forEach((stockQuote: NodeHydrationValues) => {
      promises.push(addToWatchlist(
        message.chat.id,
        message.from.id,
        stockQuote.appendix?.symbol,
        stockQuote.appendix?.tradePrice
      ));
      promises.push(RobinhoodWrapperClient.addToWatchlist(
        firebaseConfig.watchlist.track,
        stockQuote.appendix?.symbol
      ));
    });
    const notFoundStockList = tickerSymbols.filter((symbol) =>
      !stockListQuote.map((slq: NodeHydrationValues) => slq.appendix?.symbol).includes(symbol));
    const replyMessages = stockListQuote.map((stockQuote: NodeHydrationValues) =>
      `[${stockQuote.appendix?.symbol}](https://robinhood.com/stocks/${stockQuote.appendix?.symbol})`);
    let replyMessageText =
      replyMessages.length > 0 ?"*Added to watchlist:*\n" + replyMessages.join(", ") + "\n\n" :"";
    if (notFoundStockList.length > 0) {
      replyMessageText +=
        "*Tickers not found:*\n" +
        notFoundStockList.map((t) => `$${t}`).join(", ");
    }
    promises.push(_sendMessage(ctx, replyMessageText));
  } else {
    promises.push(sendReportForWatchlistByPerformanceToGroups(ctx, message.chat.id));
  }
  promises.push(addExpiringMessage(
    message.chat.id,
    message.message_id,
    MessageAction.DELETE,
    expireIn3Hours()
  ));
  await Promise.all(promises);
};

export const onText = async (ctx: any) => {
  const promises = [];
  const message = ctx.update.message || ctx.update.edited_message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  const groupId = message.chat.id;
  const tickerSymbols = extractTickerSymbolsInsideMessageText(message.text);
  const replyToMessage = message.reply_to_message;
  const replyToMessageId = replyToMessage ? replyToMessage.message_id : null;
  const isReplyToPinnedMessage = replyToMessageId?
    await getPinnedMessageWithType(
      groupId,
      replyToMessageId,
      MessageType.DAILY_PERFORMER
    ):
    null;
  let flaggedCountryList: any[] = [];
  if (tickerSymbols.length > 0) {
    const stockListQuote = await generateHydrationValues(tickerSymbols);
    stockListQuote.forEach((stockQuote: NodeHydrationValues) => {
      promises.push(addMentionedTicker(
        message.chat.id,
        message.from.id,
        stockQuote.appendix?.symbol,
        stockQuote.appendix?.tradePrice
      ));
      promises.push(RobinhoodWrapperClient.addToWatchlist(
        firebaseConfig.watchlist.mentioned,
        stockQuote.appendix?.symbol
      ));
      if (!_.isEmpty(isReplyToPinnedMessage)) {
        logger.log(isReplyToPinnedMessage);
      }
    });
    if (await checkIfServiceActiveOnGroup(groupId, "automated_quotes")) {
      if (
        await checkIfServiceActiveOnGroup(groupId, "report_flagged_country")
      ) {
        flaggedCountryList = Object.keys(flaggedCountries);
      }

      const notFoundStockList = tickerSymbols.filter((symbol) =>
        !stockListQuote.map((slq: NodeHydrationValues) => slq.appendix?.symbol).includes(symbol));
      const filteredStockListQuote = stockListQuote.filter((stockQuote: NodeHydrationValues) =>
        !flaggedCountryList.includes(stockQuote.appendix?.country));
      const replyMessages = filteredStockListQuote.map((stockQuote: NodeHydrationValues) =>
        stockQuote.appendix?.displayMessageStockQuote);
      let replyMessageText = replyMessages.join("\n");
      if (notFoundStockList.length > 0) {
        replyMessageText +=
          "\n*Tickers not found:*\n" +
          notFoundStockList.map((t) => `$${t}`).join(", ");
      }
      if (replyMessageText) {
        promises.push(ctx.reply(replyMessageText, {
          parse_mode: "Markdown",
          disable_web_page_preview: true
        }));
      }

      flaggedCountryList.forEach((countryCode) => {
        const header = `*🚨🚨🚨 ${flaggedCountries[countryCode].name} 🚨🚨🚨*\n\n`;
        const footer = `\nRequested by [${requesterName}](tg://user?id=${requesterId})`;
        const flaggedStockListQuote = stockListQuote.filter((stockQuote: NodeHydrationValues) => stockQuote.appendix?.country === countryCode);
        const flaggedReplyMessages = flaggedStockListQuote.map((stockQuote: NodeHydrationValues) => stockQuote.appendix?.displayMessageStockQuote);
        if (flaggedReplyMessages.length > 0) {
          promises.push(ctx.reply(header + flaggedReplyMessages.join("\n") + footer, {
            parse_mode: "Markdown",
            disable_web_page_preview: true
          }));
        }
      });
    }
  }
  await Promise.all(promises);
};

export const onNewChatMembers = async (ctx: any) => {
  const promises = [];
  const message = ctx.update.message;
  const groupId = message.chat.id;
  if (await checkIfServiceActiveOnGroup(groupId, "automated_welcome_members")) {
    const newMember = message.new_chat_members.map((member: any) => `[${member.first_name}](tg://user?id=${member.id})`);
    promises.push(ctx.reply(
      `Welcome ${newMember.join()} to *${
        ctx.update.message.chat.title
      }* group!`,
      { parse_mode: "Markdown" }
    ));
  }
  message.new_chat_members.forEach((member: any) => {
    promises.push(addUser(member.id, member, message.date));
  });
  await Promise.all(promises);
};

export const commandCreatePoll = async (ctx: any) => {
  const message = ctx.update.message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  if (message.chat.type === "group") {
    const groupId = message.chat.id;
    const pollInfo = {
      question: "Portfolio Movement @4PM?",
      options: [
        "Super Bullish (+ve) 🚀🚀",
        "Bullish (+ve) 🚀",
        "Bearish (-ve) 💩",
        "Full barbaad ho gaya 💩😫"
      ]
    };
    await addPoll(groupId, pollInfo, message.from, message.date);
    await ctx.reply(
      `Request completed, your new poll is ready to schedule.\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  } else {
    await ctx.reply(
      `Request failed, only groups are allowed to create new polls.\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  }
};

export const commandListPoll = async (ctx: any) => {
  const message = ctx.update.message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  if (message.chat.type === "group") {
    const groupId = message.chat.id;
    const snapshot = await getPolls(groupId);
    const replyResponse: any[] = [];
    Object.keys(snapshot).forEach((pollId) => {
      if (snapshot[pollId].enabled === true) {
        replyResponse.push(snapshot[pollId].question);
      }
    });
    if (replyResponse.length > 0) {
      await ctx.reply(
        "Your polls:\n\n" +
          replyResponse
            .map((element, index) => index + 1 + ". " + element)
            .join("\n"),
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.reply(
        `You don't have any polls yet.\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    }
  } else {
    await ctx.reply(
      `Request failed, only groups are allowed to use polls feature.\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  }
};
