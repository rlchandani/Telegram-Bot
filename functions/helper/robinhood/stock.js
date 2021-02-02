"use strict";

exports.getQuote = async (Robinhood, symbol) => {
  return new Promise((resolve, reject) => {
    Robinhood.quote_data(symbol, (err, response, body) => {
      if (err) throw err;
      resolve(body);
    });
  });
};
