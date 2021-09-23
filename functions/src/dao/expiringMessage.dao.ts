import { logger } from "firebase-functions";
import { firebaseExpiringMessageRef } from "../helper/dbHelper";

const add = async (groupId: string, messageId: any, action: any, expiringTime: any) => {
  firebaseExpiringMessageRef.child(expiringTime).child(groupId).push({
    messageId,
    action
  });
};

const get = async (expiringTimeStart: any, expiringTimeEnd: any) => {
  return firebaseExpiringMessageRef
    .orderByKey()
    .startAt(expiringTimeStart)
    .endAt(expiringTimeEnd)
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      logger.error("Failed to query database in function: getAll.", err);
      throw err;
    });
};

const remove = async (expiringTime: string, groupId: string) => {
  return firebaseExpiringMessageRef.child(expiringTime).child(groupId).remove();
};

export { add, get, remove };
