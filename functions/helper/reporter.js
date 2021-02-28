"use strict";

const { firebaseConfig } = require("../helper/firebase_config");
const countryCodeToFlag = require("country-code-to-flag");
const RobinhoodWrapper = require("../helper/robinhood_wrapper");
const orchestrator = require("../orchestrator");
const { getStockListQuote } = require("../helper/robinhood_helper");
const _ = require("lodash-contrib");

const RobinhoodWrapperClient = new RobinhoodWrapper(
  firebaseConfig.robinhood.username,
  firebaseConfig.robinhood.password,
  firebaseConfig.robinhood.api_key
);

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
  const symbols = [];
  const responseData = await orchestrator.getMentionedTickerByDaysForGroup(groupId, days);
  responseData.forEach((data) =>
    Object.values(data).forEach((value) => {
      if (!symbols.includes(value.symbol)) {
        symbols.push(value.symbol);
      }
    })
  );
  const responseDataNormalized = await orchestrator.getMentionedTickerNormalizedBySymbolsForGroup(groupId, symbols);
  const stockListQuote = await getStockListQuote(RobinhoodWrapperClient, symbols);
  const responseTickerInfo = symbols.map((symbol) => {
    const stockQuote = stockListQuote.filter((item) => item.symbol == symbol)[0];
    const stockQuoteNormalized = responseDataNormalized.filter((item) => item.symbol === symbol)[0];
    return stockQuote.setFirstMentioned(stockQuoteNormalized.price, stockQuoteNormalized.createdOn);
  });
  return _.chain(responseTickerInfo)
    .orderBy(["firstMentionedPL", "todayPL", "lastExtendedHoursTradePrice", "lastTradePrice", "symbol"], ["desc", "desc", "desc", "desc", "asc"])
    .value();
};

exports.getWatchlistTickersByPerformance = async (groupId) => {
  const responseData = await orchestrator.getWatchlistForGroup(groupId);
  const responseTickerInfo = {};
  Object.keys(responseData).forEach((key) => {
    const stockQuotes = responseData[key];
    if (Object.keys(stockQuotes).length > 0) {
      const firstQuote = stockQuotes[Object.keys(stockQuotes)[0]];
      if (!(firstQuote.symbol in responseTickerInfo)) {
        responseTickerInfo[firstQuote.symbol] = {
          symbol: firstQuote.symbol,
          first_mentioned_price: parseFloat(firstQuote.price).toFixed(2),
          first_mentioned_on: firstQuote.createdOn,
        };
      }
    }
  });
  const stockQuotes = await this.getStockListQuote(Object.keys(responseTickerInfo));
  stockQuotes.forEach((stockQuote) => {
    const current = responseTickerInfo[stockQuote.symbol];
    const pl = parseFloat(stockQuote.last_trade_price - current.first_mentioned_price).toFixed(2);
    const plPercentage = parseFloat((pl * 100) / current.first_mentioned_price).toFixed(2);
    const lastTradedPrice = parseFloat(stockQuote.last_trade_price).toFixed(2);
    current["country"] = stockQuote.country;
    current["country_flag"] = stockQuote.country_flag;
    current["sector"] = stockQuote.sector;
    current["last_trade_price"] = parseFloat(lastTradedPrice);
    current["pl"] = parseFloat(pl);
    current["pl_percentage"] = parseFloat(plPercentage);
  });
  return _.chain(responseTickerInfo).orderBy(["pl_percentage", "pl", "last_trade_price", "symbol"], ["desc", "desc", "desc", "asc"]).value();
};

exports.getWatchlistTickersByPerformanceGroupBySector = async (groupId) => {
  const response = await this.getWatchlistTickersByPerformance(groupId);
  return _.mapValues(_.groupBy(response, "sector"), (v) =>
    _.orderBy(v, ["pl_percentage", "pl", "last_trade_price", "symbol"], ["desc", "desc", "desc", "asc"])
  );
};

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
                  resolve(stockQuote);
                });
              });
            })
        ).then((stockQuotes) => {
          return Promise.all(
            stockQuotes.map((stockQuote) => {
              return new Promise((resolve, reject) => {
                RobinhoodWrapperClient.getFundamentals(stockQuote.symbol).then((fundamental) => {
                  stockQuote["sector"] = fundamental.sector;
                  resolve(stockQuote);
                });
              });
            })
          );
        });
        resolve(stockQuotes);
      } else {
        resolve([]);
      }
    });
  });
};
