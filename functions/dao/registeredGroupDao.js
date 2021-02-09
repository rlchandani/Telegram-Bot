"use strict";

const functions = require("firebase-functions");

const { firebaseRegisteredGroupsRef } = require("../helper/dbHelper");

exports.add = async (groupId, groupInfo, requestedBy, date, enabled) => {
  const snapshot = await this.get(groupId);
  if (
    snapshot == null ||
    snapshot.title != groupInfo.title ||
    snapshot.type != groupInfo.type ||
    snapshot.all_members_are_administrators != groupInfo.all_members_are_administrators
  ) {
    groupInfo["enabled"] = false;
    groupInfo["requested_by"] = requestedBy;
    groupInfo["created_at"] = snapshot != null ? snapshot.created_at : date;
    groupInfo["updated_at"] = date;
    await firebaseRegisteredGroupsRef.child(groupId).set(groupInfo);
    return true;
  }
  if (enabled) {
    await this.enable(groupId);
    return true;
  }
  return false;
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
