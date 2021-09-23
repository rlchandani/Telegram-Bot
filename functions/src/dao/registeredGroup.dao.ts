import { logger } from "firebase-functions";
import { firebaseRegisteredGroupsRef } from "../helper/dbHelper";

const add = async (groupId: any, groupInfo: any, requestedBy: any, date: any, enabled: any) => {
  const snapshot = await get(groupId);
  if (
    snapshot === null ||
    snapshot.title !== groupInfo.title ||
    snapshot.type !== groupInfo.type ||
    snapshot.all_members_are_administrators !== groupInfo.all_members_are_administrators
  ) {
    groupInfo.enabled = false;
    groupInfo.service = snapshot && snapshot.service ? snapshot.service : null;
    groupInfo.requested_by = requestedBy;
    groupInfo.created_at = snapshot !== null && snapshot.created_at ? snapshot.created_at : date;
    groupInfo.updated_at = date;
    await firebaseRegisteredGroupsRef.child(groupId).set(groupInfo);
    return true;
  }
  if (enabled) {
    await enable(groupId);
    return true;
  }
  return false;
};

const getAll = async () => {
  return firebaseRegisteredGroupsRef
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      logger.error("Failed to query database in function: getAll.", err);
      throw err;
    });
};

const get = async (groupId: any) => {
  return firebaseRegisteredGroupsRef
    .child(groupId)
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      logger.error("Failed to query database in function: get.", err);
      throw err;
    });
};

const enable = async (groupId: any) => {
  return firebaseRegisteredGroupsRef.child(groupId).child("enabled").set(true);
};

const enableService = async (groupId: any, serviceName: any) => {
  return firebaseRegisteredGroupsRef.child(groupId).child("service").child(serviceName).set(true);
};

const disable = async (groupId: any) => {
  return firebaseRegisteredGroupsRef.child(groupId).child("enabled").set(false);
};

const disableService = async (groupId: any, serviceName: any) => {
  return firebaseRegisteredGroupsRef.child(groupId).child("service").child(serviceName).set(false);
};

const remove = async (groupId: any) => {
  return firebaseRegisteredGroupsRef.child(groupId).remove();
};

const purge = async () => {
  return firebaseRegisteredGroupsRef.remove();
};

export { add, getAll, get, enable, enableService, disable, disableService, remove, purge };
