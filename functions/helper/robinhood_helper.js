const countryCodeToFlag = require("country-code-to-flag");
const { StockQuoteBuilder } = require("../model/stock_quote");
const _ = require("lodash-contrib");
const moment = require("moment-timezone");

exports.getStockListQuote = (RobinhoodWrapperClient, tickerSymbols, vsSpy = false) => {
  if (_.isEmpty(tickerSymbols)) {
    return [];
  }
  let stripSPY = false;
  return new Promise((resolve, reject) => {
    if (vsSpy && !tickerSymbols.includes("SPY")) {
      // tickerSymbols.unshift("SPY");
      tickerSymbols.push("SPY");
      stripSPY = true;
    }
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
        )
          .then((stockQuoteBuilders) => {
            return Promise.all(
              stockQuoteBuilders.map((stockQuoteBuilder) => {
                return new Promise((resolve, reject) => {
                  RobinhoodWrapperClient.getFundamentals(stockQuoteBuilder.symbol).then((fundamental) => {
                    stockQuoteBuilder.setSector(fundamental.sector);
                    stockQuoteBuilder.setIndustry(fundamental.industry);
                    stockQuoteBuilder.setMarketCap(fundamental.market_cap);
                    stockQuoteBuilder.setHigh52Week(fundamental.high_52_weeks);
                    stockQuoteBuilder.setLow52Week(fundamental.low_52_weeks);
                    resolve(stockQuoteBuilder);
                  });
                });
              })
            );
          })
          .then((stockQuoteBuilders) => {
            if (!vsSpy) {
              return stockQuoteBuilders.map((stockQuoteBuilder) => stockQuoteBuilder.build());
            } else {
              return new Promise((resolve, reject) => {
                RobinhoodWrapperClient.getHistoricals(tickerSymbols).then((stockHistorialResponse) => {
                  if ("results" in stockHistorialResponse) {
                    const stockHistorials = stockHistorialResponse.results.map((s) => {
                      const fourYearStart = moment().tz("America/Los_Angeles").subtract(4, "years").endOf("year").subtract(7, "days").unix();
                      const fourYearEnd = moment().tz("America/Los_Angeles").subtract(4, "years").endOf("year").unix();
                      const threeYearStart = moment().tz("America/Los_Angeles").subtract(3, "years").endOf("year").subtract(7, "days").unix();
                      const threeYearEnd = moment().tz("America/Los_Angeles").subtract(3, "years").endOf("year").unix();
                      const twoYearStart = moment().tz("America/Los_Angeles").subtract(2, "years").endOf("year").subtract(7, "days").unix();
                      const twoYearEnd = moment().tz("America/Los_Angeles").subtract(2, "years").endOf("year").unix();
                      const previousYearStart = moment().tz("America/Los_Angeles").subtract(1, "years").endOf("year").subtract(7, "days").unix();
                      const previousYearEnd = moment().tz("America/Los_Angeles").subtract(1, "years").endOf("year").unix();
                      const todayStart = moment().tz("America/Los_Angeles").subtract(7, "days").unix();
                      const todayEnd = moment().tz("America/Los_Angeles").unix();
                      const stockQuoteFourYearStart = s.historicals
                        .filter((h) => moment(h.begins_at).unix() >= fourYearStart && moment(h.begins_at).unix() <= fourYearEnd)
                        .slice(-1)[0] || { close_price: 0 };
                      const stockQuoteThreeYearStart = s.historicals
                        .filter((h) => moment(h.begins_at).unix() >= threeYearStart && moment(h.begins_at).unix() <= threeYearEnd)
                        .slice(-1)[0] || { close_price: 0 };
                      const stockQuoteTwoYearStart = s.historicals
                        .filter((h) => moment(h.begins_at).unix() >= twoYearStart && moment(h.begins_at).unix() <= twoYearEnd)
                        .slice(-1)[0] || { close_price: 0 };
                      const stockQuoteStart = s.historicals
                        .filter((h) => moment(h.begins_at).unix() >= previousYearStart && moment(h.begins_at).unix() <= previousYearEnd)
                        .slice(-1)[0] || { close_price: 0 };
                      const stockQuoteEnd = s.historicals
                        .filter((h) => moment(h.begins_at).unix() >= todayStart && moment(h.begins_at).unix() <= todayEnd)
                        .slice(-1)[0] || { close_price: 0 };
                      s.historicals = [stockQuoteFourYearStart, stockQuoteThreeYearStart, stockQuoteTwoYearStart, stockQuoteStart, stockQuoteEnd];
                      s.three_year_pl = stockQuoteThreeYearStart.close_price - stockQuoteFourYearStart.close_price;
                      s.three_year_pl_percentage = (s.three_year_pl * 100) / stockQuoteFourYearStart.close_price;
                      s.three_year_old_close_price = stockQuoteThreeYearStart.close_price;
                      s.two_year_pl = stockQuoteTwoYearStart.close_price - stockQuoteThreeYearStart.close_price;
                      s.two_year_pl_percentage = (s.two_year_pl * 100) / stockQuoteThreeYearStart.close_price;
                      s.two_year_old_close_price = stockQuoteTwoYearStart.close_price;
                      s.one_year_pl = stockQuoteStart.close_price - stockQuoteTwoYearStart.close_price;
                      s.one_year_pl_percentage = (s.one_year_pl * 100) / stockQuoteTwoYearStart.close_price;
                      s.one_year_old_close_price = stockQuoteStart.close_price;
                      s.ytd = stockQuoteEnd.close_price - stockQuoteStart.close_price;
                      s.ytd_percentage = (s.ytd * 100) / stockQuoteStart.close_price;
                      return s;
                    });
                    const stockHistorialSPY = stockHistorials.filter((s) => s.symbol === "SPY");
                    const stockQuotes = Promise.all(
                      stockQuoteBuilders.map((stockQuoteBuilder) => {
                        const stockHistorial = stockHistorials.filter((s) => s.symbol === stockQuoteBuilder.symbol);
                        return new Promise((resolve, reject) =>
                          resolve(
                            stockQuoteBuilder
                              .setThreeYearPL(stockHistorial[0].three_year_pl)
                              .setThreeYearPLPercentage(stockHistorial[0].three_year_pl_percentage)
                              .setThreeYearOldClosePrice(stockHistorial[0].three_year_old_close_price)
                              .setTwoYearPL(stockHistorial[0].two_year_pl)
                              .setTwoYearPLPercentage(stockHistorial[0].two_year_pl_percentage)
                              .setTwoYearOldClosePrice(stockHistorial[0].two_year_old_close_price)
                              .setOneYearPL(stockHistorial[0].one_year_pl)
                              .setOneYearPLPercentage(stockHistorial[0].one_year_pl_percentage)
                              .setOneYearOldClosePrice(stockHistorial[0].one_year_old_close_price)
                              .setYtd(stockHistorial[0].ytd)
                              .setYtdPercentage(stockHistorial[0].ytd_percentage)
                              .setYtdSpy(stockHistorial[0].ytd_percentage - stockHistorialSPY[0].ytd_percentage)
                              .setOneYearSpy(stockHistorial[0].one_year_pl_percentage - stockHistorialSPY[0].one_year_pl_percentage)
                              .setTwoYearSpy(stockHistorial[0].two_year_pl_percentage - stockHistorialSPY[0].two_year_pl_percentage)
                              .setThreeYearSpy(stockHistorial[0].three_year_pl_percentage - stockHistorialSPY[0].three_year_pl_percentage)
                              .build()
                          )
                        );
                      })
                    );
                    resolve(stockQuotes);
                  } else {
                    const stockQuotes = Promise.all(
                      stockQuoteBuilders.map((stockQuoteBuilder) => {
                        return new Promise((resolve, reject) => resolve(stockQuoteBuilder.build()));
                      })
                    );
                    resolve(stockQuotes);
                  }
                });
              });
            }
          });
        resolve(
          stockQuotes.then((s) => {
            if (stripSPY) {
              tickerSymbols.pop();
              return s.filter((a) => a.getSymbol() !== "SPY");
            }
            return s;
          })
        );
      } else {
        resolve([]);
      }
    });
  });
};
