"use strict";

const functions = require("firebase-functions");
const { create } = require("../robinhood/session");
const { getQuote } = require("../robinhood/stock");
const { nowHour } = require("../utils");
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
      ctx.reply(
        "Already Registered, this group will receieve automated polls.\n" +
          `Requested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    } else {
      await registerGroup(groupId, message.chat, message.from, message.date);
      ctx.reply(
        "Registered, this group will receieve automated polls.\n" +
          `Requested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    }
  } else {
    ctx.reply(
      "Registration failed, only groups are allowed to register.\n" +
        `Requested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  }
};

exports.commandDeRegister = async (ctx) => {
  const message = ctx.update.message;
  functions.logger.info(message);
  const requesterId = message.from.id;
  const requesterName = message.from.first_name;
  if (message.chat.type === "group") {
    const groupId = message.chat.id;
    if (await checkIfGroupExist(groupId)) {
      await deRegisteredGroup(groupId);
      ctx.reply(
        "Deregistered, this group has been removed from automated polls.\n" +
          `Requested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    } else {
      ctx.reply(
        "Not Registered, this group was not regsistered to receieve automated polls.\n" +
          `Requested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    }
  } else {
    ctx.reply(
      "Deregistered failed, only groups are allowed to deregister.\n" +
        `Requested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  }
};

exports.commandQuote = async (ctx) => {
  const message = ctx.update.message;
  const requestedCommand = message.text.split(/(\s+)/).filter((e) => e.trim().length > 0);
  let replyMessage;
  if (requestedCommand.length == 2) {
    const symbol = requestedCommand[1];
    replyMessage = await ctx.reply(await this.getStockQuote(symbol), { parse_mode: "Markdown" });
    /* if (message.chat.type === "group") {
      registerExpiringMessage(nowHour(), message.chat.id, message.message_id);
      registerExpiringMessage(nowHour(), replyMessage.chat.id, replyMessage.message_id);
    } */
  } else {
    replyMessage = await ctx.reply(`Please provide ticker symbol to track\nExample: ${requestedCommand[0]} TSLA`, {
      parse_mode: "Markdown",
    });
    registerExpiringMessage(nowHour(), message.chat.id, message.message_id);
    registerExpiringMessage(nowHour(), replyMessage.chat.id, replyMessage.message_id);
  }
};

exports.getStockQuote = async (symbol) => {
  const Robinhood = await create(config.robinhood.username, config.robinhood.password, config.robinhood.api_key);
  const stockQuote = await getQuote(Robinhood, symbol);
  if ("results" in stockQuote) {
    const stockQuoteResult = stockQuote.results[0];
    const tickerSymbol = stockQuoteResult.symbol;
    const tradedPrice = parseFloat(stockQuoteResult.last_trade_price).toFixed(2);
    const extendedTradedPrice = parseFloat(
      stockQuoteResult.last_extended_hours_trade_price || stockQuoteResult.last_trade_price
    ).toFixed(2);
    const previousTradedPrice = parseFloat(stockQuoteResult.previous_close).toFixed(2);
    const extendedPreviousTradedPrice = parseFloat(
      stockQuoteResult.adjusted_previous_close || stockQuoteResult.previous_close
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
    return (
      `*Ticker:* [${tickerSymbol}](https://robinhood.com/stocks/${tickerSymbol})\n` +
      `*Price:* $${extendedTradedPrice} ${totalIcon}\n` +
      `*Today:* $${todayDiff} (${todayPL}%) ${todayIcon}\n` +
      `*After Hours:* $${todayAfterHourDiff} (${todayAfterHourDiffPL}%) ${todayAfterHourDiffIcon}\n\n`
      // `*Total P/L:* $${total} (${totalPL}%)`
    );
  } else {
    return `*Ticker:* [${symbol}](https://robinhood.com/stocks/${symbol})\nInvalid ticker`;
  }
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
    ctx.reply(
      "Request completed, your new poll is ready to schedule.\n" +
        `Requested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  } else {
    ctx.reply(
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
      ctx.reply("Your polls:\n\n" + replyResponse.map((element, index) => index + 1 + ". " + element).join("\n"), {
        parse_mode: "Markdown",
      });
    } else {
      ctx.reply("You don't have any polls yet.\n" + `Requested by [${requesterName}](tg://user?id=${requesterId})`, {
        parse_mode: "Markdown",
      });
    }
  } else {
    ctx.reply(
      "Request failed, only groups are allowed to use polls feature.\n" +
        `Requested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  }
};
