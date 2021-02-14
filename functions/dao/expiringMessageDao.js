"use strict";

const functions = require("firebase-functions");

const { firebaseExpiringMessageRef } = require("../helper/dbHelper");

exports.add = async (groupId, messageId, action, expiringTime) => {
  firebaseExpiringMessageRef.child(expiringTime).child(groupId).push({ messageId, action });
};

exports.get = async (expiringTimeStart, expiringTimeEnd) => {
  return firebaseExpiringMessageRef
    .orderByKey()
    .startAt(expiringTimeStart)
    .endAt(expiringTimeEnd)
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      functions.logger.error("Failed to query database in function: getAll.", err);
      throw err;
    });
};

exports.delete = async (expiringTime, groupId) => {
  return firebaseExpiringMessageRef.child(expiringTime).child(groupId).remove();
};
