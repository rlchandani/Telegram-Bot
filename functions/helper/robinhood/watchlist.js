"use strict";

exports.getAllWatchlist = async (Robinhood) => {
  return new Promise((resolve, reject) => {
    Robinhood.url("https://api.robinhood.com/midlands/lists/default/", (err, response, body) => {
      if (err) throw err;
      if ("results" in body) {
        resolve(body.results);
      } else {
        resolve([]);
      }
    });
  });
};

exports.getWatchlistByName = async (Robinhood, name) => {
  return new Promise((resolve, reject) => {
    this.getAllWatchlist(Robinhood).then((watchlists) => {
      const filteredWatclist = watchlists
        .filter((watchlist) => watchlist.display_name === name)
        .map((watchlist) => watchlist.id);
      if (filteredWatclist.length > 0) {
        const listId = filteredWatclist[0];
        Robinhood.url(`https://api.robinhood.com/midlands/lists/items/?list_id=${listId}`, (err, response, body) => {
          if (err) throw err;
          if ("results" in body) {
            resolve(body.results);
          } else {
            resolve(new Error("Failed to query watchlist"));
          }
        });
      } else {
        resolve(new Error(`Watchlist with name: ${name} not found!`));
      }
    });
  });
};

exports.addToWatchlist = async (Robinhood, name, symbol) => {
  return new Promise((resolve, reject) => {
    this.getAllWatchlist(Robinhood).then((watchlists) => {
      const filteredWatclist = watchlists
        .filter((watchlist) => watchlist.display_name === name)
        .map((watchlist) => watchlist.id);
      if (filteredWatclist.length > 0) {
        const listId = filteredWatclist[0];
        Robinhood.instruments(symbol, (err, response, body) => {
          if (err) throw err;
          if ("results" in body && body.results.length > 0) {
            const instrumentId = body.results[0].id;
            const params = {};
            params[listId] = [
              {
                object_type: "instrument",
                object_id: instrumentId,
                operation: "create",
              },
            ];
            Robinhood.url_post("https://api.robinhood.com/midlands/lists/items/", params, (err, response, body) => {
              if (err) throw err;
              resolve(body);
            });
          } else {
            reject(new Error(`Could not find symbol: ${symbol}`));
          }
        });
      } else {
        resolve(new Error(`Watchlist with name: ${name} not found!`));
      }
    });
  });
};
