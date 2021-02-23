"use strict";

const functions = require("firebase-functions");
const { firebaseMentionedTickerNormalizedRef } = require("../helper/dbHelper");

exports.add = async (groupId, userId, day, symbol, price, createdOn) => {
  const snapshot = await this.get(groupId, symbol);
  if (snapshot == null) {
    await firebaseMentionedTickerNormalizedRef
      .child(groupId)
      .child(symbol)
      .set({
        day: day,
        userId: userId,
        symbol: symbol,
        price: parseFloat(price),
        createdOn: createdOn,
      });
    return true;
  }
  return false;
};

exports.get = async (groupId, symbol) => {
  return firebaseMentionedTickerNormalizedRef
    .child(groupId)
    .child(symbol)
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      functions.logger.error("Failed to query database in function: search.", err);
      throw err;
    });
};

exports.getTickerBySybolsForGroup = async (groupId, symbols=[]) => {
  const promises = symbols.map((symbol) => {
    return firebaseMentionedTickerNormalizedRef
      .child(groupId)
      .child(symbol)
      .once("value")
      .then((data) => {
        return data.val() !== null ? data.val() : null;
      })
      .catch((err) => {
        functions.logger.error("Failed to query database in function: search.", err);
        throw err;
      });
  });
  return Promise.all(promises).then((snapshots) => {
    return snapshots.filter((p) => p != null);
  });
};
