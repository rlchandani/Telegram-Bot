"use strict";

const functions = require("firebase-functions");
const moment = require("moment-timezone");
const _ = require("lodash-contrib");

exports.extractTickerSymbolsInsideMessageText = (message) => {
  if (_.isEmpty(message)) {
    return [];
  }
  const re = /[\s!%^&*()_,></?;:'".=+\-\\]*(\$[a-zA-Z]+)/g;
  const matches = Array.from(message.matchAll(re)).map((match) => match[1]);
  return matches ? [...new Set(matches.map((m) => m.replace(/(\$+)/g, "")))] : [];
};

exports.extractTickerSymbolsFromQuoteCommand = (message) => {
  if (_.isEmpty(message)) {
    return [];
  }
  const re = /[\s$]+(\w+)/g;
  const matches = Array.from(message.matchAll(re)).map((match) => match[1]);
  return matches ? [...new Set(matches.map((m) => m.replace(/(\$+)/g, "")))] : [];
};

exports.extractCashTag = (message, entities) => {
  if (_.isEmpty(message) || _.isEmpty(entities)) {
    return [];
  }
  return entities
    .map((item) => {
      if (item.type === "cashtag") {
        return message.substring(item.offset + 1, item.offset + item.length);
      }
    })
    .filter((item) => item !== undefined && item !== null);
};

exports.extractHashTag = (message, entities) => {
  if (_.isEmpty(message) || _.isEmpty(entities)) {
    return [];
  }
  return entities
    .map((item) => {
      if (item.type === "hashtag") {
        return message.substring(item.offset + 1, item.offset + item.length);
      }
    })
    .filter((item) => item !== undefined && item !== null);
};

exports.getPriceMovementIcon = (price) => {
  if (price < 0) {
    return "🔻";
  }
  if (price > 0) {
    return "🔺";
  }
  return "";
};

exports.isMarketOpenToday = async (RobinhoodWrapperClient) => {
  functions.logger.info("isMarketOpenToday: Checking if market is open today");
  const marketsResponse = await RobinhoodWrapperClient.getMarkets();
  const markets = marketsResponse.results;
  const urls = markets.map((market) => market.url + "hours/" + moment().tz("America/Los_Angeles").format("YYYY-MM-DD"));
  const isMarketOpen = urls.map((url) => RobinhoodWrapperClient.getUrl(url));
  return Promise.all(isMarketOpen).then((values) => {
    return values.filter((v) => v.is_open == true).length > 0;
  });
};

exports.roundToTwo = (num) => {
  return +(Math.round(num + "e+2") + "e-2");
};

exports.getLastTradedPrice = (lastTradedPrice, lastExtendedHourTradedPrice) => {
  if (lastExtendedHourTradedPrice > 0) {
    return this.roundToTwo(lastExtendedHourTradedPrice);
  }
  return this.roundToTwo(lastTradedPrice);
};

exports.mapTickerQuoteMessage = (stockQuote, hyperlink = true) => {
  const tickerSymbol = stockQuote.symbol;
  const tradedPrice = this.roundToTwo(stockQuote.last_trade_price);
  const extendedTradedPrice = this.roundToTwo(stockQuote.last_extended_hours_trade_price || stockQuote.last_trade_price);
  const previousTradedPrice = this.roundToTwo(stockQuote.previous_close);
  const extendedPreviousTradedPrice = this.roundToTwo(stockQuote.adjusted_previous_close || stockQuote.previous_close);

  const todayDiff = this.roundToTwo(tradedPrice - previousTradedPrice);
  const todayPL = this.roundToTwo((todayDiff * 100) / previousTradedPrice);
  const todayIcon = this.getPriceMovementIcon(todayPL);

  const todayAfterHourDiff = this.roundToTwo(extendedTradedPrice - tradedPrice);
  const todayAfterHourDiffPL = this.roundToTwo((todayAfterHourDiff * 100) / tradedPrice);
  const todayAfterHourDiffIcon = this.getPriceMovementIcon(todayAfterHourDiffPL);

  const total = this.roundToTwo(extendedTradedPrice - extendedPreviousTradedPrice);
  const totalPL = this.roundToTwo((total * 100) / extendedPreviousTradedPrice);
  const totalIcon = this.getPriceMovementIcon(totalPL);

  const tickerText = hyperlink ? `[${tickerSymbol}](https://robinhood.com/stocks/${tickerSymbol})` : `${tickerSymbol}`;
  return (
    `*Ticker:* ${tickerText} ${stockQuote.country_flag} (${stockQuote.country})\n` +
    `*Price:* $${extendedTradedPrice} ${totalIcon}\n` +
    `*Today:* $${todayDiff} (${todayPL}%) ${todayIcon}\n` +
    `*After Hours:* $${todayAfterHourDiff} (${todayAfterHourDiffPL}%) ${todayAfterHourDiffIcon}\n\n`
    // `*Total P/L:* $${total} (${totalPL}%)`
  );
};
