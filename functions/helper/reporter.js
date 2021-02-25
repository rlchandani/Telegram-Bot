"use strict";

const { firebaseConfig } = require("../helper/firebase_config");
const countryCodeToFlag = require("country-code-to-flag");
const RobinhoodWrapper = require("../helper/robinhood_wrapper");
const orchestrator = require("../orchestrator");
const { roundToTwo } = require("../helper/utils");
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
  const responseData = await orchestrator.getMentionedTickerByDaysForGroup(groupId, days);
  const symbols = [...new Set(responseData.map((data) => Object.values(data).map((value) => value.symbol)))][0];
  const responseDataNormalized = await orchestrator.getMentionedTickerNormalizedBySymbolsForGroup(groupId, symbols);
  const responseTickerInfo = {};
  responseData.forEach((data) => {
    Object.keys(data).forEach((key) => {
      Object.keys(data[key]).forEach((k) => {
        const stockQuote = data[key];
        if (!(stockQuote.symbol in responseTickerInfo)) {
          const stockQuoteNormalized = responseDataNormalized.filter((item) => item.symbol === stockQuote.symbol)[0];
          if (stockQuoteNormalized !== undefined) {
            responseTickerInfo[stockQuote.symbol] = {
              symbol: stockQuoteNormalized.symbol,
              first_mentioned_price: parseFloat(stockQuoteNormalized.price).toFixed(2),
              day: stockQuoteNormalized.day,
              first_mentioned_on: stockQuoteNormalized.createdOn,
            };
          }
        }
      });
    });
  });
  const stockQuotes = await this.getStockListQuote(Object.keys(responseTickerInfo));
  stockQuotes.forEach((stockQuote) => {
    const current = responseTickerInfo[stockQuote.symbol];

    const tradedPrice = roundToTwo(stockQuote.last_trade_price);
    const extendedTradedPrice = roundToTwo(stockQuote.last_extended_hours_trade_price || stockQuote.last_trade_price);
    const previousTradedPrice = roundToTwo(stockQuote.previous_close);
    const extendedPreviousTradedPrice = roundToTwo(stockQuote.adjusted_previous_close || stockQuote.previous_close);

    const todayDiff = roundToTwo(tradedPrice - previousTradedPrice);
    const todayPL = roundToTwo((todayDiff * 100) / previousTradedPrice);

    const todayAfterHourDiff = roundToTwo(extendedTradedPrice - tradedPrice);
    const todayAfterHourDiffPL = roundToTwo((todayAfterHourDiff * 100) / tradedPrice);

    const totalDiff = roundToTwo(extendedTradedPrice - extendedPreviousTradedPrice);
    const totalPL = roundToTwo((totalDiff * 100) / extendedPreviousTradedPrice);

    const firstMentionedDiff = roundToTwo(extendedTradedPrice - current.first_mentioned_price);
    const firstMentionedPL = roundToTwo((totalDiff * 100) / current.first_mentioned_price);

    current["country"] = stockQuote.country;
    current["country_flag"] = stockQuote.country_flag;
    current["sector"] = stockQuote.sector;
    current["last_trade_price"] = tradedPrice;
    current["last_extended_hours_trade_price"] = extendedTradedPrice;
    current["today_diff"] = todayDiff;
    current["today_pl"] = todayPL;
    current["today_after_hour_diff"] = todayAfterHourDiff;
    current["today_after_hour_pl"] = todayAfterHourDiffPL;
    current["total_diff"] = totalDiff;
    current["total_pl"] = totalPL;
    current["first_mentioned_diff"] = firstMentionedDiff;
    current["first_mentioned_pl"] = firstMentionedPL;
  });
  return _.chain(responseTickerInfo)
    .orderBy(
      ["first_mentioned_pl", "total_pl", "last_extended_hours_trade_price", "last_trade_price", "symbol"],
      ["desc", "desc", "desc", "desc", "asc"]
    )
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
