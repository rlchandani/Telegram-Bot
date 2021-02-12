"use strict";

const functions = require("firebase-functions");
const { firebaseWatchlistRef } = require("../helper/dbHelper");

exports.add = async (groupId, symbol, price, userId, createdOn) => {
  firebaseWatchlistRef
    .child(groupId)
    .child(symbol)
    .push({
      groupId: groupId,
      symbol: symbol,
      price: parseFloat(price),
      userId: userId,
      createdOn: createdOn,
    });
};

exports.getWatchlistForGroup = async (groupId) => {
  return firebaseWatchlistRef
    .child(groupId)
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      functions.logger.error("Failed to query database in function: search.", err);
      throw err;
    });
};
