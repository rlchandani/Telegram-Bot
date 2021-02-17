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
const utils = require("../utils");
const timeUtil = require("../timeUtil");
const messageAction = require("../../model/message_action");
const { registerOptions } = require("../../model/register_action");
const countryCodeToFlag = require("country-code-to-flag");
const _ = require("lodash-contrib");

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
  await registerExpiringMessage(message.chat.id, message.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
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
  await registerExpiringMessage(message.chat.id, message.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
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
  await registerExpiringMessage(message.chat.id, message.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
};

exports.commandQuote = async (ctx) => {
  const message = ctx.update.message;
  const tickerSymbols = utils.extractTickerSymbolsFromQuoteCommand(message.text);
  if (tickerSymbols.length > 0) {
    const stockListQuote = await this.getStockListQuote(tickerSymbols);
    const promises = [];
    stockListQuote.forEach((stockQuote) => {
      promises.push(registerMentionedTicker(message.chat.id, message.from.id, stockQuote.symbol, stockQuote.last_trade_price));
      promises.push(RobinhoodWrapperClient.addToWatchlist(firebaseConfig.watchlist.mentioned, stockQuote.symbol));
    });
    await Promise.all(promises);
    const replyMessages = stockListQuote.map((stockQuote) => mapTickerQuoteMessage(stockQuote));
    if (replyMessages.length > 0) {
      const replyMessage = await ctx.reply(replyMessages.join(""), { parse_mode: "Markdown", disable_web_page_preview: true });
      await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
    } else {
      const replyMessage = await ctx.reply("None of the provided tickers were found!", { parse_mode: "Markdown" });
      await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
    }
  } else {
    const replyMessage = await ctx.reply("Please provide ticker symbol to track\nExample: /quote TSLA", { parse_mode: "Markdown" });
    await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
  }
  await registerExpiringMessage(message.chat.id, message.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
};

exports.commandSp500Up = async (ctx) => {
  const message = ctx.update.message;
  const response = await RobinhoodWrapperClient.getSP500Up();
  if ("results" in response) {
    const results = response.results;
    const tickerSymbols = results.map((s) => s.symbol);
    if (tickerSymbols.length > 0) {
      const stockListQuote = await this.getStockListQuote(tickerSymbols);
      const replyMessages = stockListQuote.map((stockQuote) => mapTickerQuoteMessage(stockQuote));
      if (replyMessages.length > 0) {
        const replyMessage = await ctx.reply(replyMessages.join(""), { parse_mode: "Markdown", disable_web_page_preview: true });
        await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
      }
    }
  } else {
    const replyMessage = await ctx.reply("Sorry, failed to fetch SP500 up list from server.\nPlease try again after sometime", {
      parse_mode: "Markdown",
    });
    await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
  }
  await registerExpiringMessage(message.chat.id, message.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
};

exports.commandSp500Down = async (ctx) => {
  const message = ctx.update.message;
  const response = await RobinhoodWrapperClient.getSP500Down();
  if ("results" in response) {
    const results = response.results;
    const tickerSymbols = results.map((s) => s.symbol);
    if (tickerSymbols.length > 0) {
      const stockListQuote = await this.getStockListQuote(tickerSymbols);
      const replyMessages = stockListQuote.map((stockQuote) => mapTickerQuoteMessage(stockQuote));
      if (replyMessages.length > 0) {
        const replyMessage = await ctx.reply(replyMessages.join(""), { parse_mode: "Markdown", disable_web_page_preview: true });
        await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
      }
    }
  } else {
    const replyMessage = await ctx.reply("Sorry, failed to fetch SP500 down list from server.\nPlease try again after sometime", {
      parse_mode: "Markdown",
    });
    await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
  }
  await registerExpiringMessage(message.chat.id, message.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
};

exports.commandNews = async (ctx) => {
  const promises = [];
  const message = ctx.update.message;
  const tickerSymbols = utils.extractTickerSymbolsFromQuoteCommand(message.text);
  if (tickerSymbols.length > 0) {
    tickerSymbols.forEach(async (tickerSymbol) => promises.push(_commandNews(ctx, tickerSymbol)));
  } else {
    const replyMessage = await ctx.reply("Please provide ticker symbol to track\nExample: /news TSLA", { parse_mode: "Markdown" });
    promises.push(registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.DELETE, timeUtil.expireIn3Hours()));
  }
  promises.push(registerExpiringMessage(message.chat.id, message.message_id, messageAction.DELETE, timeUtil.expireIn3Hours()));
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
      await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
    } else {
      const replyMessage = await ctx.reply(`No news found for ${tickerSymbol}`, { parse_mode: "Markdown" });
      await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
    }
  } else {
    const replyMessage = await ctx.reply(`No news found for ${tickerSymbol}`, { parse_mode: "Markdown" });
    await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
  }
};

exports.commandWatch = async (ctx) => {
  const promises = [];
  const message = ctx.update.message;
  const tickerSymbols = utils.extractTickerSymbolsFromQuoteCommand(message.text);
  if (tickerSymbols.length > 0) {
    const stockListQuote = await this.getStockListQuote(tickerSymbols);
    stockListQuote.forEach((stockQuote) => {
      promises.push(addToWatchlist(message.chat.id, stockQuote.symbol, stockQuote.last_trade_price, message.from.id));
      promises.push(RobinhoodWrapperClient.addToWatchlist(firebaseConfig.watchlist.track, stockQuote.symbol));
    });
    const replyMessages = stockListQuote.map((stockQuote) => `[${stockQuote.symbol}](https://robinhood.com/stocks/${stockQuote.symbol})`);
    if (replyMessages.length > 0) {
      const replyMessage = await ctx.reply("Added to watchlist: " + replyMessages.join(", "), {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });
      promises.push(registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.DELETE, timeUtil.expireIn3Hours()));
    } else {
      const replyMessage = await ctx.reply("None of the provided tickers were found!", { parse_mode: "Markdown" });
      await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
    }
  } else {
    promises.push(sendReportForWatchlistByPerformanceToGroups(ctx, message.chat.id));
  }
  promises.push(registerExpiringMessage(message.chat.id, message.message_id, messageAction.DELETE, timeUtil.expireIn3Hours()));
  await Promise.all(promises);
};

exports.onText = async (ctx) => {
  const promises = [];
  const message = ctx.update.message;
  const groupId = message.chat.id;
  const tickerSymbols = utils.extractTickerSymbolsInsideMessageText(message.text);
  if (tickerSymbols.length > 0) {
    const stockListQuote = await this.getStockListQuote(tickerSymbols);
    stockListQuote.forEach((stockQuote) => {
      promises.push(registerMentionedTicker(message.chat.id, message.from.id, stockQuote.symbol, stockQuote.last_trade_price));
      promises.push(RobinhoodWrapperClient.addToWatchlist(firebaseConfig.watchlist.mentioned, stockQuote.symbol));
    });
    if (await checkIfServiceActiveOnRegisteredGroup(groupId, "automated_quotes")) {
      const replyMessages = stockListQuote.map((stockQuote) => mapTickerQuoteMessage(stockQuote));
      if (replyMessages.length > 0) {
        promises.push(ctx.reply(replyMessages.join(""), { parse_mode: "Markdown", disable_web_page_preview: true }));
      }
    }
  }
  await Promise.all(promises);
};

exports.onEditedMessage = async (ctx) => {
  const promises = [];
  const message = ctx.update.edited_message;
  const groupId = message.chat.id;
  const tickerSymbols = utils.extractTickerSymbolsInsideMessageText(message.text);
  if (tickerSymbols.length > 0) {
    const stockListQuote = await this.getStockListQuote(tickerSymbols);
    stockListQuote.forEach((stockQuote) => {
      promises.push(registerMentionedTicker(message.chat.id, message.from.id, stockQuote.symbol, stockQuote.last_trade_price));
      promises.push(RobinhoodWrapperClient.addToWatchlist(firebaseConfig.watchlist.mentioned, stockQuote.symbol));
    });
    if (await checkIfServiceActiveOnRegisteredGroup(groupId, "automated_quotes")) {
      const replyMessages = stockListQuote.map((stockQuote) => mapTickerQuoteMessage(stockQuote));
      if (replyMessages.length > 0) {
        promises.push(ctx.reply(replyMessages.join(""), { parse_mode: "Markdown", disable_web_page_preview: true }));
      }
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

const mapTickerQuoteMessage = (stockQuote, hyperlink = true) => {
  const tickerSymbol = stockQuote.symbol;
  const tradedPrice = parseFloat(stockQuote.last_trade_price).toFixed(2);
  const extendedTradedPrice = parseFloat(stockQuote.last_extended_hours_trade_price || stockQuote.last_trade_price).toFixed(2);
  const previousTradedPrice = parseFloat(stockQuote.previous_close).toFixed(2);
  const extendedPreviousTradedPrice = parseFloat(stockQuote.adjusted_previous_close || stockQuote.previous_close).toFixed(2);

  const todayDiff = (tradedPrice - previousTradedPrice).toFixed(2);
  const todayPL = ((todayDiff * 100) / previousTradedPrice).toFixed(2);
  const todayIcon = utils.getPriceMovementIcon(todayPL);

  const todayAfterHourDiff = (extendedTradedPrice - tradedPrice).toFixed(2);
  const todayAfterHourDiffPL = ((todayAfterHourDiff * 100) / tradedPrice).toFixed(2);
  const todayAfterHourDiffIcon = utils.getPriceMovementIcon(todayAfterHourDiffPL);

  const total = (extendedTradedPrice - extendedPreviousTradedPrice).toFixed(2);
  const totalPL = ((total * 100) / extendedPreviousTradedPrice).toFixed(2);
  const totalIcon = utils.getPriceMovementIcon(totalPL);

  const tickerText = hyperlink ? `[${tickerSymbol}](https://robinhood.com/stocks/${tickerSymbol})` : `${tickerSymbol}`;
  return (
    `*Ticker:* ${tickerText} ${stockQuote.country_flag} (${stockQuote.country})\n` +
    `*Price:* $${extendedTradedPrice} ${totalIcon}\n` +
    `*Today:* $${todayDiff} (${todayPL}%) ${todayIcon}\n` +
    `*After Hours:* $${todayAfterHourDiff} (${todayAfterHourDiffPL}%) ${todayAfterHourDiffIcon}\n\n`
    // `*Total P/L:* $${total} (${totalPL}%)`
  );
};

/* exports.getStockListQuote = async (tickerSymbols) => {
  const response = await RobinhoodWrapperClient.getQuote(tickerSymbols);
  if ("results" in response) {
    const stockQuote = response.results;
    const filteredStockQuote = await Promise.all(
      stockQuote
        .filter((s) => s != null)
        .map(async (stockQuote) => {
          return new Promise((resolve, reject) => {
            RobinhoodWrapperClient.getUrl(stockQuote.instrument).then((instrumentDocument) => {
              stockQuote["country"] = instrumentDocument.country;
              stockQuote["country_flag"] = countryCodeToFlag(instrumentDocument.country);
              resolve(stockQuote);
            });
          });
        })
    );
    return filteredStockQuote;
  }
  return [];
}; */

exports.getStockListQuote = (tickerSymbols) => {
  if (_.isEmpty(tickerSymbols)) {
    return [];
  }
  return new Promise((resolve, reject) => {
    RobinhoodWrapperClient.getQuote(tickerSymbols).then((stockQuoteResponse) => {
      if ("results" in stockQuoteResponse) {
        const stockQuotes = Promise.all(
          stockQuoteResponse.results
            .filter((s) => s != null)
            .map((stockQuote) => {
              return new Promise((resolve, reject) => {
                RobinhoodWrapperClient.getUrl(stockQuote.instrument).then((instrumentDocument) => {
                  stockQuote["country"] = instrumentDocument.country;
                  stockQuote["country_flag"] = countryCodeToFlag(instrumentDocument.country);
                  return resolve(stockQuote);
                });
              });
            })
        );
        resolve(stockQuotes);
      } else {
        resolve([]);
      }
    });
  });
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
