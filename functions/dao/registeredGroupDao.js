"use strict";

const functions = require("firebase-functions");

const { firebaseRegisteredGroupsRef } = require("../helper/dbHelper");

exports.add = async (groupId, groupInfo, requestedBy, date) => {
  const snapshot = await this.get(groupId);
  groupInfo["enabled"] = true;
  groupInfo["requested_by"] = requestedBy;
  groupInfo["created_at"] = snapshot != null ? snapshot.created_at : date;
  groupInfo["updated_at"] = date;
  firebaseRegisteredGroupsRef.child(groupId).set(groupInfo);
};

exports.getAll = async () => {
  return firebaseRegisteredGroupsRef
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      functions.logger.error("Failed to query database in function: getAll.", err);
      throw err;
    });
};

exports.get = async (groupId) => {
  return firebaseRegisteredGroupsRef
    .child(groupId)
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      functions.logger.error("Failed to query database in function: get.", err);
      throw err;
    });
};

exports.enable = async (groupId) => {
  return firebaseRegisteredGroupsRef.child(groupId).child("enabled").set(true);
};

exports.disable = async (groupId) => {
  return firebaseRegisteredGroupsRef.child(groupId).child("enabled").set(false);
};

exports.delete = async (groupId) => {
  return firebaseRegisteredGroupsRef.child(groupId).remove();
};

exports.purge = async () => {
  return firebaseRegisteredGroupsRef.remove();
};
