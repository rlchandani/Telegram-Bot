"use strict";

const functions = require("firebase-functions");
const { todayDate, currentUnixTimestamp } = require("../helper/utils");

const { firebaseMentionedTickerRef } = require("../helper/dbHelper");

exports.add = async (groupId, userId, symbol, price) => {
  firebaseMentionedTickerRef.child(groupId).push({
    day: todayDate(),
    userId: userId,
    symbol: symbol,
    price: parseFloat(price),
    createdOn: currentUnixTimestamp(),
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
