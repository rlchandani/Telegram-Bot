"use strict";

const { getDateString } = require("../utils");

exports.marketIsOpenToday = async (Robinhood) => {
  return new Promise((resolve, reject) => {
    Robinhood.markets((err, response, body) => {
      if (err) throw err;
      const urls = body.results.map((market) => market.url + "hours/" + getDateString("America/Los_Angeles"));
      const isMarketOpen = urls.map(async (url) => await this.url(Robinhood, url));
      Promise.all(isMarketOpen).then((values) => {
        const filteredValues = values.filter((v) => v.is_open == true);
        resolve(filteredValues.length > 0);
      });
    });
  });
};

exports.getSp500Up = async (Robinhood) => {
  return new Promise((resolve, reject) => {
    Robinhood.sp500_up((err, response, body) => {
      if (err) throw err;
      resolve(body);
    });
  });
};

exports.getSp500Down = async (Robinhood) => {
  return new Promise((resolve, reject) => {
    Robinhood.sp500_down((err, response, body) => {
      if (err) throw err;
      resolve(body);
    });
  });
};

exports.getNews = async (Robinhood, symbol) => {
  return new Promise((resolve, reject) => {
    Robinhood.news(symbol, (err, response, body) => {
      if (err) throw err;
      resolve(body);
    });
  });
};

exports.url = (Robinhood, url) => {
  return new Promise((resolve, reject) => {
    Robinhood.url(url, (err, response, body) => {
      resolve(body);
    });
  });
};
