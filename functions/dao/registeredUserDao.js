"use strict";

const functions = require("firebase-functions");

const { firebaseRegisteredUsersRef } = require("../helper/dbHelper");

exports.add = async (userId, userInfo, date) => {
  const snapshot = await this.get(userId);
  if (snapshot == null || snapshot.first_name != userInfo.first_name) {
    userInfo["enabled"] = true;
    userInfo["created_at"] = snapshot != null ? snapshot.created_at : date;
    userInfo["updated_at"] = date;
    await firebaseRegisteredUsersRef.child(userId).set(userInfo);
    return true;
  }
  return false;
};

exports.getAll = async () => {
  return firebaseRegisteredUsersRef
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      functions.logger.error("Failed to query database in function: getAll.", err);
      throw err;
    });
};

exports.get = async (userId) => {
  return firebaseRegisteredUsersRef
    .child(userId)
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      functions.logger.error("Failed to query database in function: get.", err);
      throw err;
    });
};

exports.enable = async (userId) => {
  return firebaseRegisteredUsersRef.child(userId).child("enabled").set(true);
};

exports.disable = async (userId) => {
  return firebaseRegisteredUsersRef.child(userId).child("enabled").set(false);
};

exports.delete = async (userId) => {
  return firebaseRegisteredUsersRef.child(userId).remove();
};

exports.purge = async () => {
  return firebaseRegisteredUsersRef.remove();
};
