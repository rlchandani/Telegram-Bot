"use strict";

const functions = require("firebase-functions");
const { create } = require("../robinhood/session");
const { getQuote } = require("../robinhood/stock");
const { nowHour, extractTickerSymbolsInsideMessageText, extractTickerSymbolsFromQuoteCommand } = require("../utils");
const {
  registerExpiringMessage,
  checkIfGroupExist,
  registerGroup,
  deRegisteredGroup,
  getPolls,
  registerPoll,
} = require("../../orchestrator");
let config = functions.config();

// Check if not dev
if (process.env.FUNCTIONS_EMULATOR) {
  config = JSON.parse(process.env.DEBUG_TELEGRAM_CONFIG);
}

exports.commandRegister = async (ctx) => {
  const message = ctx.update.message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  if (message.chat.type === "group") {
    const groupId = message.chat.id;
    if (await checkIfGroupExist(groupId)) {
      await ctx.reply(
        "Already Registered, this group will receieve automated polls.\n" +
          `Requested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    } else {
      await registerGroup(groupId, message.chat, message.from, message.date);
      await ctx.reply(
        "Registered, this group will receieve automated polls.\n" +
          `Requested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    }
  } else {
    await ctx.reply(
      "Registration failed, only groups are allowed to register.\n" +
        `Requested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  }
};

exports.commandDeRegister = async (ctx) => {
  const message = ctx.update.message;
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  if (message.chat.type === "group") {
    const groupId = message.chat.id;
    if (await checkIfGroupExist(groupId)) {
      await deRegisteredGroup(groupId);
      await ctx.reply(
        "Deregistered, this group has been removed from automated polls.\n" +
          `Requested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.reply(
        "Not Registered, this group was not regsistered to receieve automated polls.\n" +
          `Requested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    }
  } else {
    await ctx.reply(
      "Deregistered failed, only groups are allowed to deregister.\n" +
        `Requested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  }
};

exports.commandQuote = async (ctx) => {
  const message = ctx.update.message;
  const tickerSymbols = extractTickerSymbolsFromQuoteCommand(message.text);
  if (tickerSymbols.length > 0) {
    const stockListQuote = await this.getStockListQuote(tickerSymbols);
    const replyMessages = stockListQuote.map((stockQuote) => mapTickerQuoteMessage(stockQuote));
    replyMessages.forEach(async (replyMessageText) => {
      if (replyMessageText) {
        const replyMessage = await ctx.reply(replyMessageText, { parse_mode: "Markdown" });
        if (message.chat.type === "group") {
          registerExpiringMessage(nowHour(), message.chat.id, message.message_id);
          registerExpiringMessage(nowHour(), replyMessage.chat.id, replyMessage.message_id);
        }
      }
    });
  } else {
    const replyMessage = await ctx.reply("Please provide ticker symbol to track\nExample: /quote TSLA", {
      parse_mode: "Markdown",
    });
    registerExpiringMessage(nowHour(), message.chat.id, message.message_id);
    registerExpiringMessage(nowHour(), replyMessage.chat.id, replyMessage.message_id);
  }
};

exports.onText = async (ctx) => {
  const message = ctx.update.message;
  const tickerSymbols = extractTickerSymbolsInsideMessageText(message.text);
  if (tickerSymbols.length > 0) {
    const stockListQuote = await this.getStockListQuote(tickerSymbols);
    const replyMessages = stockListQuote.map((stockQuote) => mapTickerQuoteMessage(stockQuote, false));
    // replyMessages.forEach((replyMessageText) => {
    //   ctx.reply(replyMessageText, { parse_mode: "Markdown" });
    // });
    if (replyMessages.length > 0) {
      await ctx.reply(replyMessages.join(""), { parse_mode: "Markdown" });
    }
  }
};

const mapTickerQuoteMessage = (stockQuote, hyperlink = true) => {
  const tickerSymbol = stockQuote.symbol;
  const tradedPrice = parseFloat(stockQuote.last_trade_price).toFixed(2);
  const extendedTradedPrice = parseFloat(
    stockQuote.last_extended_hours_trade_price || stockQuote.last_trade_price
  ).toFixed(2);
  const previousTradedPrice = parseFloat(stockQuote.previous_close).toFixed(2);
  const extendedPreviousTradedPrice = parseFloat(
    stockQuote.adjusted_previous_close || stockQuote.previous_close
  ).toFixed(2);

  const todayDiff = (tradedPrice - previousTradedPrice).toFixed(2);
  const todayPL = ((todayDiff * 100) / previousTradedPrice).toFixed(2);
  const todayIcon = getPriceMovementIcon(todayPL);

  const todayAfterHourDiff = (extendedTradedPrice - tradedPrice).toFixed(2);
  const todayAfterHourDiffPL = ((todayAfterHourDiff * 100) / tradedPrice).toFixed(2);
  const todayAfterHourDiffIcon = getPriceMovementIcon(todayAfterHourDiffPL);

  const total = (extendedTradedPrice - extendedPreviousTradedPrice).toFixed(2);
  const totalPL = ((total * 100) / extendedPreviousTradedPrice).toFixed(2);
  const totalIcon = getPriceMovementIcon(totalPL);

  const tickerText = hyperlink ? `[${tickerSymbol}](https://robinhood.com/stocks/${tickerSymbol})` : `${tickerSymbol}`;
  return (
    `*Ticker:* ${tickerText}\n` +
    `*Price:* $${extendedTradedPrice} ${totalIcon}\n` +
    `*Today:* $${todayDiff} (${todayPL}%) ${todayIcon}\n` +
    `*After Hours:* $${todayAfterHourDiff} (${todayAfterHourDiffPL}%) ${todayAfterHourDiffIcon}\n\n`
    // `*Total P/L:* $${total} (${totalPL}%)`
  );
};

exports.getStockListQuote = async (tickerSymbols) => {
  const Robinhood = await create(config.robinhood.username, config.robinhood.password, config.robinhood.api_key);
  const response = await getQuote(Robinhood, tickerSymbols);
  if ("results" in response) {
    const stockQuote = response.results;
    return stockQuote.filter((s) => s != null);
  }
  return [];
};

const getPriceMovementIcon = (price) => {
  if (price < 0) {
    return "🔻";
  }
  if (price > 0) {
    return "🔺";
  }
  return "";
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
    await ctx.reply(
      "Request completed, your new poll is ready to schedule.\n" +
        `Requested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  } else {
    await ctx.reply(
      "Request failed, only groups are allowed to create new polls.\n" +
        `Requested by [${requesterName}](tg://user?id=${requesterId})`,
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
      await ctx.reply(
        "Your polls:\n\n" + replyResponse.map((element, index) => index + 1 + ". " + element).join("\n"),
        {
          parse_mode: "Markdown",
        }
      );
    } else {
      await ctx.reply(
        "You don't have any polls yet.\n" + `Requested by [${requesterName}](tg://user?id=${requesterId})`,
        {
          parse_mode: "Markdown",
        }
      );
    }
  } else {
    await ctx.reply(
      "Request failed, only groups are allowed to use polls feature.\n" +
        `Requested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  }
};
