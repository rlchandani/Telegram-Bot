"use strict";

const functions = require("firebase-functions");
const { create } = require("../robinhood/session");
const { getQuote } = require("../robinhood/stock");
let config = functions.config();

// Check if not dev
if (process.env.FUNCTIONS_EMULATOR) {
  config = JSON.parse(process.env.DEBUG_TELEGRAM_CONFIG);
}

exports.getStockQuote = async (symbol) => {
  const Robinhood = await create(config.robinhood.username, config.robinhood.password, config.robinhood.api_key);
  const stockQuote = (await getQuote(Robinhood, symbol)).results;
  const tickerSymbol = stockQuote[0].symbol;
  const tradedPrice = parseFloat(stockQuote[0].last_trade_price).toFixed(2);
  const extendedTradedPrice = parseFloat(stockQuote[0].last_extended_hours_trade_price).toFixed(2);
  const previousTradedPrice = parseFloat(stockQuote[0].previous_close).toFixed(2);
  const previousExtendedTradedPrice = parseFloat(stockQuote[0].adjusted_previous_close).toFixed(2);

  const todayDiff = (tradedPrice - previousTradedPrice).toFixed(2);
  const todayPL = (todayDiff * 100 / previousTradedPrice).toFixed(2);
  const todayIcon = todayPL > 0 ? "🔺" : "🔻";

  const todayAfterHourDiff = (extendedTradedPrice - tradedPrice).toFixed(2);
  const todayAfterHourDiffPL = (todayAfterHourDiff * 100 / tradedPrice).toFixed(2);
  const todayAfterHourDiffIcon = todayAfterHourDiffPL > 0 ? "🔺" : "🔻";

  const total = (extendedTradedPrice - previousExtendedTradedPrice).toFixed(2);
  const totalPL = (total * 100 / previousExtendedTradedPrice).toFixed(2);
  const totalIcon = totalPL > 0 ? "🔺" : "🔻";
  return (
    `*Ticker:* [${tickerSymbol}](https://robinhood.com/stocks/${tickerSymbol})\n` +
    `*Price:* $${extendedTradedPrice} ${totalIcon}\n` +
    `*Today:* $${todayDiff} (${todayPL}%) ${todayIcon}\n` +
    `*After Hours:* $${todayAfterHourDiff} (${todayAfterHourDiffPL}%) ${todayAfterHourDiffIcon}\n\n`
    // `*Total P/L:* $${total} (${totalPL}%)`
  );
};
