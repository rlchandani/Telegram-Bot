"use strict";

const functions = require("firebase-functions");
const { firebaseMentionedTickerRef } = require("../helper/dbHelper");

exports.add = async (groupId, userId, day, symbol, price, createdOn) => {
  firebaseMentionedTickerRef.child(groupId).push({
    day: day,
    userId: userId,
    symbol: symbol,
    price: parseFloat(price),
    createdOn: createdOn,
  });
};

exports.getTickerByDaysForGroup = async (groupId, days) => {
  const promises = days.map((day) => {
    return firebaseMentionedTickerRef
      .child(groupId)
      .orderByChild("day")
      .equalTo(day)
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
