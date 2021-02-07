"use strict";

const functions = require("firebase-functions");
const _ = require("lodash-contrib");
const orchestrator = require("../orchestrator");
const { create } = require("../helper/robinhood/session");
const { getQuote } = require("../helper/robinhood/stock");
let config = functions.config();

// Check if not dev
if (process.env.FUNCTIONS_EMULATOR) {
  config = JSON.parse(process.env.DEBUG_TELEGRAM_CONFIG);
}

exports.getTopMentionedTickersByCount = async (groupId, days) => {
  const responseData = await orchestrator.getMentionedTickerByDaysForGroup(groupId, days);
  const responseTickerInfo = {};
  responseData.forEach((data) => {
    Object.values(data).forEach((value) => {
      const tickerSymbol = value.symbol;
      if (tickerSymbol in responseTickerInfo) {
        responseTickerInfo[tickerSymbol] += 1;
      } else {
        responseTickerInfo[tickerSymbol] = 1;
      }
    });
  });
  return _.fromPairs(_.sortBy(_.toPairs(responseTickerInfo), 1).reverse());
};

exports.getTopMentionedTickersByPerformance = async (groupId, days) => {
  const responseData = await orchestrator.getMentionedTickerByDaysForGroup(groupId, days);
  const responseTickerInfo = {};
  responseData.forEach((data) => {
    Object.keys(data).forEach((key) => {
      Object.keys(data[key]).forEach((k) => {
        const stockQuote = data[key];
        if (!(stockQuote.symbol in responseTickerInfo)) {
          responseTickerInfo[stockQuote.symbol] = {
            symbol: stockQuote.symbol,
            first_mentioned_price: parseFloat(stockQuote.price),
            day: stockQuote.day,
            first_mentioned_on: stockQuote.createdOn,
          };
        }
      });
    });
  });
  const stockQuotes = await this.getStockListQuote(Object.keys(responseTickerInfo));
  stockQuotes.forEach((stockQuote) => {
    const current = responseTickerInfo[stockQuote.symbol];
    const pl = stockQuote.last_trade_price - current.first_mentioned_price;
    const plPercentage = (pl * 100) / current.first_mentioned_price;
    current["last_trade_price"] = parseFloat(stockQuote.last_trade_price);
    current["pl"] = pl;
    current["pl_percentage"] = plPercentage;
  });
  return _.chain(responseTickerInfo)
    .orderBy(["pl_percentage", "pl", "last_trade_price", "symbol"], ["desc", "desc", "desc", "asc"])
    .value();
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
