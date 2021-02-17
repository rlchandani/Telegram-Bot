/* eslint-disable require-jsdoc */
"use strict";

const functions = require("firebase-functions");
const fs = require("fs");
const robinhood = require("../lib/robinhood");
const { authenticator } = require("otplib");
const tokenFile = "/tmp/token.json";
const _ = require("lodash-contrib");

class RobinhoodWrapper {
  constructor(username, password, apiKey) {
    this.username = username;
    this.password = password;
    this.apiKey = apiKey;
    this.Robinhood = null;
  }

  generateMFAToken = () => authenticator.generate(this.apiKey);

  login = async () => {
    return new Promise((resolve, reject) => {
      if (fs.existsSync(tokenFile) && (Date.now() - fs.statSync(tokenFile).mtime.getTime()) / 1000 < 86400) {
        const cachedToken = require(tokenFile);
        const credentials = {
          token: cachedToken.token,
        };
        functions.logger.info("Found cached credentials");
        resolve(robinhood(credentials));
      } else {
        const credentials = {
          username: this.username,
          password: this.password,
        };
        const Robinhood = robinhood(credentials, (data) => {
          if (data && data.mfa_required) {
            Robinhood.set_mfa_code(this.generateMFAToken(), async () => {
              const credentialJSON = {
                token: Robinhood.auth_token(),
              };
              await fs.promises.writeFile(tokenFile, JSON.stringify(credentialJSON));
              functions.logger.info("Credentials not found, caching credentials");
              resolve(Robinhood);
            });
          } else {
            resolve();
          }
        });
      }
    });
  };

  getQuote = async (symbols) => {
    if (this.Robinhood == null) {
      this.Robinhood = await this.login();
    }
    symbols = Array.isArray(symbols) ? (symbols = symbols.filter((symbol) => parseInt(symbol) != symbol)) : symbols.replace(/[0-9]/g, "");
    if (_.isEmpty(symbols)) {
      return [];
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.quote_data(symbols, (err, response, body) => {
        if (err) throw err;
        resolve(body);
      });
    });
  };

  getSP500Up = async () => {
    if (this.Robinhood == null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.sp500_up((err, response, body) => {
        if (err) throw err;
        resolve(body);
      });
    });
  };

  getSP500Down = async () => {
    if (this.Robinhood == null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.sp500_down((err, response, body) => {
        if (err) throw err;
        resolve(body);
      });
    });
  };

  getNews = async (symbol) => {
    if (this.Robinhood == null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.news(symbol, (err, response, body) => {
        if (err) throw err;
        resolve(body);
      });
    });
  };

  getHistory = async (symbol) => {
    if (this.Robinhood == null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.historicals(symbol, "month", "year", (err, response, body) => {
        if (err) throw err;
        resolve(body);
      });
    });
  };

  getUrl = async (url) => {
    if (this.Robinhood == null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.url(url, (err, response, body) => {
        resolve(body);
      });
    });
  };

  postUrl = async (url, params) => {
    if (this.Robinhood == null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.url_post(url, params, (err, response, body) => {
        resolve(body);
      });
    });
  };

  getInstruments = async (symbol) => {
    if (this.Robinhood == null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.instruments(symbol, (err, response, body) => {
        resolve(body);
      });
    });
  };

  getFundamentals = async (symbol) => {
    if (this.Robinhood == null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.fundamentals(symbol, (err, response, body) => {
        resolve(body);
      });
    });
  };

  getTag = async (tag) => {
    if (this.Robinhood == null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.tag(tag, (err, response, body) => {
        resolve(body);
      });
    });
  };

  getMarkets = async (symbol) => {
    if (this.Robinhood == null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.markets((err, response, body) => {
        resolve(body);
      });
    });
  };

  getPositions = async () => {
    if (this.Robinhood == null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.positions((err, response, body) => {
        if (err) throw err;
        resolve(body);
      });
    });
  };

  getAllWatchlist = async () => {
    return this.getUrl("https://api.robinhood.com/midlands/lists/default/");
  };

  getWatchlistByName = async (name) => {
    const watchlistResponse = await this.getAllWatchlist();
    const watchlists = watchlistResponse.results;
    const filteredWatclist = watchlists.filter((watchlist) => watchlist.display_name === name).map((watchlist) => watchlist.id);
    if (filteredWatclist.length > 0) {
      const listId = filteredWatclist[0];
      return this.getUrl(`https://api.robinhood.com/midlands/lists/items/?list_id=${listId}`);
    } else {
      throw new Error(`Watchlist with name: ${name} not found!`);
    }
  };

  addToWatchlist = async (name, symbol) => {
    const watchlistResponse = await this.getAllWatchlist();
    const watchlists = watchlistResponse.results;
    const filteredWatclist = watchlists.filter((watchlist) => watchlist.display_name === name).map((watchlist) => watchlist.id);
    if (filteredWatclist.length > 0) {
      const listId = filteredWatclist[0];
      const instructionDocumentsResponse = await this.getInstruments(symbol);
      if ("results" in instructionDocumentsResponse && instructionDocumentsResponse.results.length > 0) {
        const instrumentId = instructionDocumentsResponse.results[0].id;
        const params = {};
        params[listId] = [
          {
            object_type: "instrument",
            object_id: instrumentId,
            operation: "create",
          },
        ];
        return await this.postUrl("https://api.robinhood.com/midlands/lists/items/", params);
      } else {
        new Error(`Could not find symbol: ${symbol}`);
      }
    } else {
      new Error(`Watchlist with name: ${name} not found!`);
    }
  };
}

module.exports = RobinhoodWrapper;
