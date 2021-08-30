const admin = require("firebase-admin");
const functions = require("firebase-functions");
const { firebaseMentionedTickerNormalizedRef } = require("../helper/dbHelper");

exports.add = async (groupId, userId, day, symbol, price, createdOn) => {
  await firebaseMentionedTickerNormalizedRef
    .child(groupId)
    .child(day)
    .child(symbol)
    .update({ total: admin.database.ServerValue.increment(1) });
  await firebaseMentionedTickerNormalizedRef
    .child(groupId)
    .child(day)
    .child(symbol)
    .child("users")
    .child(userId)
    .update({
      price: parseFloat(price),
      total: admin.database.ServerValue.increment(1),
    });
  // const snapshot = await this.get(groupId, day);
  // if (snapshot == null) {
  //   const data = {};
  //   data[symbol] = {
  //     total: 1,
  //     users: {},
  //   };
  //   data[symbol].users[userId] = {
  //     price: parseFloat(price),
  //     total: 1,
  //   };
  //   await firebaseMentionedTickerNormalizedRef.child(groupId).child(day).set(data);
  // } else {
  //   await firebaseMentionedTickerNormalizedRef
  //     .child(groupId)
  //     .child(day)
  //     .child(symbol)
  //     .update({ total: admin.database.ServerValue.increment(1) });
  //   await firebaseMentionedTickerNormalizedRef
  //     .child(groupId)
  //     .child(day)
  //     .child(symbol)
  //     .child("users")
  //     .child(userId)
  //     .update({
  //       price: parseFloat(price),
  //       total: admin.database.ServerValue.increment(1),
  //     });
  // }
  return true;
};

exports.get = async (groupId, day) => {
  return firebaseMentionedTickerNormalizedRef
    .child(groupId)
    .child(day)
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      functions.logger.error("Failed to query database in function: search.", err);
      throw err;
    });
};

exports.getTickerBySybolsForGroup = async (groupId, symbols = []) => {
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
