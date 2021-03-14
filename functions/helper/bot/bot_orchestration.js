"use strict";

const { firebaseConfig } = require("../../helper/firebase_config");
const { Markup } = require("telegraf");
const RobinhoodWrapper = require("../robinhood_wrapper");
const {
  registerExpiringMessage,
  checkIfGroupExist,
  registerGroup,
  registerUser,
  deRegisteredGroup,
  getPolls,
  registerPoll,
  registerMentionedTicker,
  addToWatchlist,
  sendReportForWatchlistByPerformanceToGroups,
  getRegisteredGroupServiceStatus,
  checkIfServiceActiveOnRegisteredGroup,
} = require("../../orchestrator");
const { extractTickerSymbolsFromQuoteCommand, extractTickerSymbolsInsideMessageText } = require("../utils");
const { getStockListQuote } = require("../robinhood_helper");
const timeUtil = require("../timeUtil");
const { DELETE } = require("../../model/message_action");
const { registerOptions } = require("../../model/register_action");
const { flaggedCountries } = require("../constant");

const RobinhoodWrapperClient = new RobinhoodWrapper(
  firebaseConfig.robinhood.username,
  firebaseConfig.robinhood.password,
  firebaseConfig.robinhood.api_key
);

exports.commandStatus = async (ctx) => {
  const message = ctx.update.message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  const groupId = message.chat.id;
  const serviceStatus = await getRegisteredGroupServiceStatus(groupId);
  const replyMessage = Object.keys(serviceStatus).map((serviceName) => `${serviceName} - \`${serviceStatus[serviceName]}\``);
  await ctx.reply("*Service Registration Status:*\n" + replyMessage.join("\n") + `\nRequested by [${requesterName}](tg://user?id=${requesterId})`, {
    parse_mode: "Markdown",
  });
  await registerExpiringMessage(message.chat.id, message.message_id, DELETE, timeUtil.expireIn3Hours());
};

exports.commandRegister = async (ctx) => {
  const message = ctx.update.message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  const groupId = message.chat.id;
  const groupType = message.chat.type;
  if (groupType === "group") {
    const groupAdmins = await ctx.getChatAdministrators(groupId);
    const foundGroupAdmins = groupAdmins.filter((admin) => admin.user.id === requesterId);
    if (foundGroupAdmins.length > 0) {
      if (!(await checkIfGroupExist(groupId))) {
        await registerGroup(groupId, message.chat, message.from.id, message.date, true);
      }
      const registerOptionKeyboard = Markup.inlineKeyboard(
        registerOptions.map((optionGroup) => optionGroup.map((option) => Markup.button.callback(option.name, option.action)))
      );
      await ctx.reply("Choose from following services:", registerOptionKeyboard);
    } else {
      await ctx.reply(
        "🚫 Unauthorized Access: Only group admins are permitted this operation.\n\n" +
          `Requested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    }
  } else {
    await ctx.reply(
      "❌ Registration Failed: only groups are allowed to register.\n\n" + `Requested by [${requesterName}](tg://user?id=${requesterId})`,
      {
        parse_mode: "Markdown",
      }
    );
  }
  await registerExpiringMessage(message.chat.id, message.message_id, DELETE, timeUtil.expireIn3Hours());
};

exports.commandDeRegister = async (ctx) => {
  const message = ctx.update.message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  const groupId = message.chat.id;
  const groupType = message.chat.type;
  if (groupType === "group") {
    const groupAdmins = await ctx.getChatAdministrators(groupId);
    const foundGroupAdmins = groupAdmins.filter((admin) => admin.user.id === requesterId);
    if (foundGroupAdmins.length > 0) {
      if (!(await checkIfGroupExist(groupId))) {
        await registerGroup(groupId, message.chat, message.from.id, message.date, true);
      }
      await deRegisteredGroup(groupId);
      await ctx.reply(
        "✅ Request Completed: Group has been removed from all registered services.\n" +
          `Requested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.reply(
        "🚫 Unauthorized Access: Only group admins are permitted this operation.\n" + `Requested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    }
  } else {
    await ctx.reply(
      "❌ Deregistered Failed: Only groups are allowed to deregister.\n" + `Requested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  }
  await registerExpiringMessage(message.chat.id, message.message_id, DELETE, timeUtil.expireIn3Hours());
};

exports.commandQuote = async (ctx) => {
  const message = ctx.update.message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  const tickerSymbols = extractTickerSymbolsFromQuoteCommand(message.text);
  let flaggedCountryList = [];
  if (tickerSymbols.length > 0) {
    const stockListQuote = await getStockListQuote(RobinhoodWrapperClient, tickerSymbols);
    const promises = [];
    stockListQuote.forEach((stockQuote) => {
      promises.push(registerMentionedTicker(message.chat.id, message.from.id, stockQuote.getSymbol(), stockQuote.getTradePrice()));
      promises.push(RobinhoodWrapperClient.addToWatchlist(firebaseConfig.watchlist.mentioned, stockQuote.getSymbol()));
    });
    await Promise.all(promises);
    if (await checkIfServiceActiveOnRegisteredGroup(message.chat.id, "report_flagged_country")) {
      flaggedCountryList = Object.keys(flaggedCountries);
    }
    const notFoundStockList = tickerSymbols.filter((symbol) => !stockListQuote.map((slq) => slq.getSymbol()).includes(symbol));
    const filteredStockListQuote = stockListQuote.filter((stockQuote) => !flaggedCountryList.includes(stockQuote.getCountry()));
    const replyMessages = filteredStockListQuote.map((stockQuote) => stockQuote.getStockQuoteMessage());
    let replyMessageText = replyMessages.join("\n");
    if (notFoundStockList.length > 0) {
      replyMessageText += "\n*Tickers not found:*\n" + notFoundStockList.map((t) => `$${t}`).join(", ");
    }
    if (replyMessageText) {
      const replyMessage = await ctx.reply(replyMessageText, { parse_mode: "Markdown", disable_web_page_preview: true });
      await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, DELETE, timeUtil.expireIn3Hours());
    }

    flaggedCountryList.forEach((countryCode) => {
      const header = `*🚨🚨🚨 ${flaggedCountries[countryCode].name} 🚨🚨🚨*\n\n`;
      const footer = `\nRequested by [${requesterName}](tg://user?id=${requesterId})`;
      const flaggedStockListQuote = stockListQuote.filter((stockQuote) => stockQuote.getCountry() === countryCode);
      const flaggedReplyMessages = flaggedStockListQuote.map((stockQuote) => stockQuote.getStockQuoteMessage());
      if (flaggedReplyMessages.length > 0) {
        promises.push(ctx.reply(header + flaggedReplyMessages.join("\n") + footer, { parse_mode: "Markdown", disable_web_page_preview: true }));
      }
    });
  } else {
    const replyMessage = await ctx.reply("Please provide ticker symbol to track\nExample: /quote TSLA", { parse_mode: "Markdown" });
    await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, DELETE, timeUtil.expireIn3Hours());
  }
  await registerExpiringMessage(message.chat.id, message.message_id, DELETE, timeUtil.expireIn3Hours());
};

exports.commandVsSPY = async (ctx) => {
  const message = ctx.update.message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  const tickerSymbols = extractTickerSymbolsFromQuoteCommand(message.text);
  let flaggedCountryList = [];
  if (tickerSymbols.length > 0) {
    const stockListQuote = await getStockListQuote(RobinhoodWrapperClient, tickerSymbols, true);
    const promises = [];
    stockListQuote.forEach((stockQuote) => {
      promises.push(registerMentionedTicker(message.chat.id, message.from.id, stockQuote.getSymbol(), stockQuote.getTradePrice()));
      promises.push(RobinhoodWrapperClient.addToWatchlist(firebaseConfig.watchlist.mentioned, stockQuote.getSymbol()));
    });
    await Promise.all(promises);
    if (await checkIfServiceActiveOnRegisteredGroup(message.chat.id, "report_flagged_country")) {
      flaggedCountryList = Object.keys(flaggedCountries);
    }
    const notFoundStockList = tickerSymbols.filter((symbol) => !stockListQuote.map((slq) => slq.getSymbol()).includes(symbol));
    const filteredStockListQuote = stockListQuote.filter((stockQuote) => !flaggedCountryList.includes(stockQuote.getCountry()));
    const replyMessages = filteredStockListQuote.map((stockQuote) => stockQuote.getVsSPYQuoteMessage());
    let replyMessageText = replyMessages.join("\n");
    if (notFoundStockList.length > 0) {
      replyMessageText += "\n*Tickers not found:*\n" + notFoundStockList.map((t) => `$${t}`).join(", ");
    }
    if (replyMessageText) {
      const replyMessage = await ctx.reply(replyMessageText, { parse_mode: "Markdown", disable_web_page_preview: true });
      await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, DELETE, timeUtil.expireIn3Hours());
    }

    flaggedCountryList.forEach((countryCode) => {
      const header = `*🚨🚨🚨 ${flaggedCountries[countryCode].name} 🚨🚨🚨*\n\n`;
      const footer = `\nRequested by [${requesterName}](tg://user?id=${requesterId})`;
      const flaggedStockListQuote = stockListQuote.filter((stockQuote) => stockQuote.getCountry() === countryCode);
      const flaggedReplyMessages = flaggedStockListQuote.map((stockQuote) => stockQuote.getVsSPYQuoteMessage());
      if (flaggedReplyMessages.length > 0) {
        promises.push(ctx.reply(header + flaggedReplyMessages.join("\n") + footer, { parse_mode: "Markdown", disable_web_page_preview: true }));
      }
    });
  } else {
    const replyMessage = await ctx.reply("Please provide ticker symbol to track\nExample: /quote TSLA", { parse_mode: "Markdown" });
    await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, DELETE, timeUtil.expireIn3Hours());
  }
  await registerExpiringMessage(message.chat.id, message.message_id, DELETE, timeUtil.expireIn3Hours());
};

exports.commandSp500Up = async (ctx) => {
  const message = ctx.update.message;
  const response = await RobinhoodWrapperClient.getSP500Up();
  if ("results" in response) {
    const results = response.results;
    const tickerSymbols = results.map((s) => s.symbol);
    if (tickerSymbols.length > 0) {
      const stockListQuote = await getStockListQuote(RobinhoodWrapperClient, tickerSymbols);
      const replyMessages = stockListQuote.map((stockQuote) => stockQuote.getStockQuoteMessage());
      if (replyMessages.length > 0) {
        const replyMessage = await ctx.reply(replyMessages.join("\n"), { parse_mode: "Markdown", disable_web_page_preview: true });
        await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, DELETE, timeUtil.expireIn3Hours());
      }
    }
  } else {
    const replyMessage = await ctx.reply("Sorry, failed to fetch SP500 up list from server.\nPlease try again after sometime", {
      parse_mode: "Markdown",
    });
    await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, DELETE, timeUtil.expireIn3Hours());
  }
  await registerExpiringMessage(message.chat.id, message.message_id, DELETE, timeUtil.expireIn3Hours());
};

exports.commandSp500Down = async (ctx) => {
  const message = ctx.update.message;
  const response = await RobinhoodWrapperClient.getSP500Down();
  if ("results" in response) {
    const results = response.results;
    const tickerSymbols = results.map((s) => s.symbol);
    if (tickerSymbols.length > 0) {
      const stockListQuote = await getStockListQuote(RobinhoodWrapperClient, tickerSymbols);
      const replyMessages = stockListQuote.map((stockQuote) => stockQuote.getStockQuoteMessage());
      if (replyMessages.length > 0) {
        const replyMessage = await ctx.reply(replyMessages.join("\n"), { parse_mode: "Markdown", disable_web_page_preview: true });
        await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, DELETE, timeUtil.expireIn3Hours());
      }
    }
  } else {
    const replyMessage = await ctx.reply("Sorry, failed to fetch SP500 down list from server.\nPlease try again after sometime", {
      parse_mode: "Markdown",
    });
    await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, DELETE, timeUtil.expireIn3Hours());
  }
  await registerExpiringMessage(message.chat.id, message.message_id, DELETE, timeUtil.expireIn3Hours());
};

exports.commandNews = async (ctx) => {
  const promises = [];
  const message = ctx.update.message;
  const tickerSymbols = extractTickerSymbolsFromQuoteCommand(message.text);
  if (tickerSymbols.length > 0) {
    tickerSymbols.forEach(async (tickerSymbol) => promises.push(_commandNews(ctx, tickerSymbol)));
  } else {
    const replyMessage = await ctx.reply("Please provide ticker symbol to track\nExample: /news TSLA", { parse_mode: "Markdown" });
    promises.push(registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, DELETE, timeUtil.expireIn3Hours()));
  }
  promises.push(registerExpiringMessage(message.chat.id, message.message_id, DELETE, timeUtil.expireIn3Hours()));
  await Promise.all(promises);
};

const _commandNews = async (ctx, tickerSymbol) => {
  const response = await RobinhoodWrapperClient.getNews(tickerSymbol);
  if ("results" in response) {
    const replyMessages = response.results.map((s, i) => `${i + 1}. [${s.title}](${s.url})\n*Source:*\`\`\`${s.source}\`\`\`\n`);
    if (replyMessages.length > 0) {
      const replyMessage = await ctx.reply(`*Ticker:* ${tickerSymbol}\n` + replyMessages.join(""), {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });
      await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, DELETE, timeUtil.expireIn3Hours());
    } else {
      const replyMessage = await ctx.reply(`No news found for ${tickerSymbol}`, { parse_mode: "Markdown" });
      await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, DELETE, timeUtil.expireIn3Hours());
    }
  } else {
    const replyMessage = await ctx.reply(`No news found for ${tickerSymbol}`, { parse_mode: "Markdown" });
    await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, DELETE, timeUtil.expireIn3Hours());
  }
};

exports.commandWatch = async (ctx) => {
  const promises = [];
  const message = ctx.update.message;
  const tickerSymbols = extractTickerSymbolsFromQuoteCommand(message.text);
  if (tickerSymbols.length > 0) {
    const stockListQuote = await getStockListQuote(RobinhoodWrapperClient, tickerSymbols);
    stockListQuote.forEach((stockQuote) => {
      promises.push(addToWatchlist(message.chat.id, message.from.id, stockQuote.getSymbol(), stockQuote.getTradePrice()));
      promises.push(RobinhoodWrapperClient.addToWatchlist(firebaseConfig.watchlist.track, stockQuote.symbol));
    });
    const notFoundStockList = tickerSymbols.filter((symbol) => !stockListQuote.map((slq) => slq.getSymbol()).includes(symbol));
    const replyMessages = stockListQuote.map((stockQuote) => `[${stockQuote.symbol}](https://robinhood.com/stocks/${stockQuote.symbol})`);
    let replyMessageText = replyMessages.length > 0 ? "*Added to watchlist:*\n" + replyMessages.join(", ") + "\n\n" : "";
    if (notFoundStockList.length > 0) {
      replyMessageText += "*Tickers not found:*\n" + notFoundStockList.map((t) => `$${t}`).join(", ");
    }
    const replyMessage = await ctx.reply(replyMessageText, { parse_mode: "Markdown", disable_web_page_preview: true });
    promises.push(registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, DELETE, timeUtil.expireIn3Hours()));
  } else {
    promises.push(sendReportForWatchlistByPerformanceToGroups(ctx, message.chat.id));
  }
  promises.push(registerExpiringMessage(message.chat.id, message.message_id, DELETE, timeUtil.expireIn3Hours()));
  await Promise.all(promises);
};

exports.onText = async (ctx) => {
  const promises = [];
  const message = ctx.update.message || ctx.update.edited_message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  const groupId = message.chat.id;
  const tickerSymbols = extractTickerSymbolsInsideMessageText(message.text);
  let flaggedCountryList = [];
  if (tickerSymbols.length > 0) {
    const stockListQuote = await getStockListQuote(RobinhoodWrapperClient, tickerSymbols);
    stockListQuote.forEach((stockQuote) => {
      promises.push(registerMentionedTicker(message.chat.id, message.from.id, stockQuote.getSymbol(), stockQuote.getTradePrice()));
      promises.push(RobinhoodWrapperClient.addToWatchlist(firebaseConfig.watchlist.mentioned, stockQuote.getSymbol()));
    });
    if (await checkIfServiceActiveOnRegisteredGroup(groupId, "automated_quotes")) {
      if (await checkIfServiceActiveOnRegisteredGroup(groupId, "report_flagged_country")) {
        flaggedCountryList = Object.keys(flaggedCountries);
      }

      const notFoundStockList = tickerSymbols.filter((symbol) => !stockListQuote.map((slq) => slq.getSymbol()).includes(symbol));
      const filteredStockListQuote = stockListQuote.filter((stockQuote) => !flaggedCountryList.includes(stockQuote.getCountry()));
      const replyMessages = filteredStockListQuote.map((stockQuote) => stockQuote.getStockQuoteMessage());
      let replyMessageText = replyMessages.join("\n");
      if (notFoundStockList.length > 0) {
        replyMessageText += "\n*Tickers not found:*\n" + notFoundStockList.map((t) => `$${t}`).join(", ");
      }
      if (replyMessageText) {
        promises.push(ctx.reply(replyMessageText, { parse_mode: "Markdown", disable_web_page_preview: true }));
      }

      flaggedCountryList.forEach((countryCode) => {
        const header = `*🚨🚨🚨 ${flaggedCountries[countryCode].name} 🚨🚨🚨*\n\n`;
        const footer = `\nRequested by [${requesterName}](tg://user?id=${requesterId})`;
        const flaggedStockListQuote = stockListQuote.filter((stockQuote) => stockQuote.getCountry() === countryCode);
        const flaggedReplyMessages = flaggedStockListQuote.map((stockQuote) => stockQuote.getStockQuoteMessage());
        if (flaggedReplyMessages.length > 0) {
          promises.push(ctx.reply(header + flaggedReplyMessages.join("\n") + footer, { parse_mode: "Markdown", disable_web_page_preview: true }));
        }
      });
    }
  }
  await Promise.all(promises);
};

exports.onNewChatMembers = async (ctx) => {
  const promises = [];
  const message = ctx.update.message;
  const groupId = message.chat.id;
  if (await checkIfServiceActiveOnRegisteredGroup(groupId, "automated_welcome_members")) {
    const newMember = message.new_chat_members.map((member) => `[${member.first_name}](tg://user?id=${member.id})`);
    promises.push(ctx.reply(`Welcome ${newMember.join()} to *${ctx.update.message.chat.title}* group!`, { parse_mode: "Markdown" }));
  }
  message.new_chat_members.forEach((member) => {
    promises.push(registerUser(member.id, member, message.date));
  });
  await Promise.all(promises);
};

exports.commandCreatePoll = async (ctx) => {
  const message = ctx.update.message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  if (message.chat.type === "group") {
    const groupId = message.chat.id;
    const pollInfo = {
      question: "Portfolio Movement @4PM?",
      options: ["Super Bullish (+ve) 🚀🚀", "Bullish (+ve) 🚀", "Bearish (-ve) 💩", "Full barbaad ho gaya 💩😫"],
    };
    await registerPoll(groupId, pollInfo, message.from, message.date);
    await ctx.reply("Request completed, your new poll is ready to schedule.\n" + `Requested by [${requesterName}](tg://user?id=${requesterId})`, {
      parse_mode: "Markdown",
    });
  } else {
    await ctx.reply(
      "Request failed, only groups are allowed to create new polls.\n" + `Requested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  }
};

exports.commandListPoll = async (ctx) => {
  const message = ctx.update.message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  if (message.chat.type === "group") {
    const groupId = message.chat.id;
    const snapshot = await getPolls(groupId);
    const replyResponse = [];
    Object.keys(snapshot).forEach((pollId) => {
      if (snapshot[pollId].enabled === true) {
        replyResponse.push(snapshot[pollId].question);
      }
    });
    if (replyResponse.length > 0) {
      await ctx.reply("Your polls:\n\n" + replyResponse.map((element, index) => index + 1 + ". " + element).join("\n"), {
        parse_mode: "Markdown",
      });
    } else {
      await ctx.reply("You don't have any polls yet.\n" + `Requested by [${requesterName}](tg://user?id=${requesterId})`, {
        parse_mode: "Markdown",
      });
    }
  } else {
    await ctx.reply(
      "Request failed, only groups are allowed to use polls feature.\n" + `Requested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  }
};
