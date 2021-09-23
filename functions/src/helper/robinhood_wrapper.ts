import _ from "lodash";
import { logger } from "firebase-functions";
import fs from "fs";
import robinhood from "./robinhood";
import { authenticator } from "otplib";
const tokenFile = "/tmp/token.json";

interface RobinhoodAPIResponse {
  results: any
}

interface WatchlistParam {
  [key: string]: [{
    // eslint-disable-next-line camelcase
    object_type: string,
    // eslint-disable-next-line camelcase
    object_id: any,
    operation: string,
  }]
}

export class RobinhoodWrapper {
  username: string;
  password: string;
  apiKey: string;
  Robinhood: any;

  constructor(username: any, password: any, apiKey: any) {
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
        const credentials = { token: cachedToken.token };
        logger.info("Found cached credentials");
        resolve(robinhood(credentials));
      } else {
        const credentials = {
          username: this.username,
          password: this.password
        };
        const Robinhood = robinhood(credentials, (data: any) => {
          if (data && data.mfa_required) {
            Robinhood.set_mfa_code(this.generateMFAToken(), async () => {
              const credentialJSON = { token: Robinhood.auth_token() };
              await fs.promises.writeFile(tokenFile, JSON.stringify(credentialJSON));
              logger.info("Credentials not found, caching credentials");
              resolve(Robinhood);
            });
          } else {
            resolve(null);
          }
        });
      }
    });
  };

  getQuote = async (symbols: any) => {
    if (this.Robinhood === null) {
      this.Robinhood = await this.login();
    }
    symbols = Array.isArray(symbols) ? (symbols = symbols.filter((symbol) => parseInt(symbol) !== symbol)) : symbols.replace(/[0-9]/g, "");
    if (_.isEmpty(symbols)) {
      return [];
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.quote_data(symbols, (err: any, response: any, body: any) => {
        if (err) throw err;
        resolve(body);
      });
    });
  };

  getSP500Up = async (): Promise<RobinhoodAPIResponse> => {
    if (this.Robinhood === null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.sp500_up((err: any, response: any, body: any) => {
        if (err) throw err;
        resolve(body);
      });
    });
  };

  getSP500Down = async (): Promise<RobinhoodAPIResponse> => {
    if (this.Robinhood === null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.sp500_down((err: any, response: any, body: any) => {
        if (err) throw err;
        resolve(body);
      });
    });
  };

  getNews = async (symbol: string): Promise<RobinhoodAPIResponse> => {
    if (this.Robinhood === null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.news(symbol, (err: any, response: any, body: any) => {
        if (err) throw err;
        resolve(body);
      });
    });
  };

  getHistoricals = async (symbols: any) => {
    if (this.Robinhood === null) {
      this.Robinhood = await this.login();
    }
    symbols = Array.isArray(symbols) ? (symbols = symbols.filter((symbol) => parseInt(symbol) !== symbol)) : symbols.replace(/[0-9]/g, "");
    if (_.isEmpty(symbols)) {
      return [];
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.historicals(symbols, "day", "5year", (err: any, response: any, body: any) => {
        if (err) throw err;
        resolve(body);
      });
    });
  };

  getUrl = async (url: string): Promise<RobinhoodAPIResponse> => {
    if (this.Robinhood === null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.url(url, (err: any, response: any, body: any) => {
        resolve(body);
      });
    });
  };

  postUrl = async (url: string, params: any) => {
    if (this.Robinhood === null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.url_post(url, params, (err: any, response: any, body: any) => {
        resolve(body);
      });
    });
  };

  getInstruments = async (symbol: string): Promise<RobinhoodAPIResponse> => {
    if (this.Robinhood === null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.instruments(symbol, (err: any, response: any, body: any) => {
        resolve(body);
      });
    });
  };

  getFundamentals = async (symbol: string) => {
    if (this.Robinhood === null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.fundamentals(symbol, (err: any, response: any, body: any) => {
        resolve(body);
      });
    });
  };

  getTag = async (tag: string) => {
    if (this.Robinhood === null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.tag(tag, (err: any, response: any, body: any) => {
        resolve(body);
      });
    });
  };

  getMarkets = async (symbol: string) => {
    if (this.Robinhood === null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.markets((err: any, response: any, body: any) => {
        resolve(body);
      });
    });
  };

  getPositions = async () => {
    if (this.Robinhood === null) {
      this.Robinhood = await this.login();
    }
    return new Promise((resolve, reject) => {
      this.Robinhood.positions((err: any, response: any, body: any) => {
        if (err) throw err;
        resolve(body);
      });
    });
  };

  getRatings = async (stockId: string): Promise<RobinhoodAPIResponse> => {
    return await this.getUrl(`https://api.robinhood.com/midlands/ratings/${stockId}/`);
  };

  getAllWatchlist = async (): Promise<RobinhoodAPIResponse> => {
    return await this.getUrl("https://api.robinhood.com/midlands/lists/default/");
  };

  getWatchlistByName = async (name: any) => {
    const watchlistResponse = await this.getAllWatchlist();
    const watchlists = watchlistResponse.results;
    const filteredWatclist = watchlists.filter((watchlist: any) => watchlist.display_name === name).map((watchlist: any) => watchlist.id);
    if (filteredWatclist.length > 0) {
      const listId = filteredWatclist[0];
      return this.getUrl(`https://api.robinhood.com/midlands/lists/items/?list_id=${listId}`);
    } else {
      throw new Error(`Watchlist with name: ${name} not found!`);
    }
  };

  addToWatchlist = async (name: any, symbol: any) => {
    const watchlistResponse = await this.getAllWatchlist();
    const watchlists = watchlistResponse.results;
    const filteredWatclist = watchlists.filter((watchlist: any) => watchlist.display_name === name).map((watchlist: any) => watchlist.id);
    if (filteredWatclist.length > 0) {
      const listId = filteredWatclist[0];
      const instructionDocumentsResponse = await this.getInstruments(symbol);
      if ("results" in instructionDocumentsResponse && instructionDocumentsResponse.results.length > 0) {
        const instrumentId = instructionDocumentsResponse.results[0].id;
        const params: WatchlistParam = {};
        params[listId] = [
          {
            object_type: "instrument",
            object_id: instrumentId,
            operation: "create"
          }
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
