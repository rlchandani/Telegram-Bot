const countryCodeToFlag = require("country-code-to-flag");
const { StockQuoteBuilder } = require("../model/stock_quote");
const _ = require("lodash-contrib");

exports.getStockListQuote = (RobinhoodWrapperClient, tickerSymbols) => {
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
                  return resolve(
                    new StockQuoteBuilder(stockQuote.symbol)
                      .setLastTradePrice(stockQuote.last_trade_price)
                      .setExtendedHourTradePrice(stockQuote.last_extended_hours_trade_price)
                      .setPreviousClose(stockQuote.previous_close)
                      .setCountry(instrumentDocument.country)
                      .setCountryFlag(countryCodeToFlag(instrumentDocument.country))
                  );
                });
              });
            })
        ).then((stockQuoteBuilders) => {
          return Promise.all(
            stockQuoteBuilders.map((stockQuoteBuilder) => {
              return new Promise((resolve, reject) => {
                RobinhoodWrapperClient.getFundamentals(stockQuoteBuilder.symbol).then((fundamental) => {
                  stockQuoteBuilder.setSector(fundamental.sector);
                  stockQuoteBuilder.setIndustry(fundamental.industry);
                  stockQuoteBuilder.setMarketCap(fundamental.market_cap);
                  stockQuoteBuilder.setHigh52Week(fundamental.high_52_weeks);
                  stockQuoteBuilder.setLow52Week(fundamental.low_52_weeks);
                  resolve(stockQuoteBuilder.build());
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
