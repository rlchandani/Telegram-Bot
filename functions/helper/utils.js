"use strict";

const functions = require("firebase-functions");
const moment = require("moment-timezone");

exports.extractTickerSymbolsInsideMessageText = (message) => {
  const re = /\$\w+/g;
  const matches = message.match(re);
  return matches ? [...new Set(matches.map((m) => m.substring(1)))] : [];
};

exports.extractTickerSymbolsFromQuoteCommand = (message) => {
  const re = /(\w+)/g;
  const matches = message.match(re);
  matches.shift();
  return matches ? [...new Set(matches)] : [];
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
