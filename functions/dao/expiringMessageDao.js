"use strict";

const functions = require("firebase-functions");

const { firebaseExpiringMessageRef } = require("../helper/dbHelper");

exports.add = async (day, groupId, messageId, action) => {
  firebaseExpiringMessageRef.child(day).child(groupId).push({ messageId, action });
};

exports.getAllForDay = async (day) => {
  return firebaseExpiringMessageRef
    .child(day)
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      functions.logger.error("Failed to query database in function: getAll.", err);
      throw err;
    });
};

exports.delete = async (day, groupId) => {
  return firebaseExpiringMessageRef.child(day).child(groupId).remove();
};
