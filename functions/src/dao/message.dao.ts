import { logger } from "firebase-functions/v1";
const { firebaseMessageRef } = require("../helper/dbHelper");

// Key -> groupId, day

const add = async (groupId: any, day: any, message: any) =>
  firebaseMessageRef
    .child(groupId)
    .child(day)
    .push(message);

const get = async (groupId: any, day: any) => {
  return firebaseMessageRef
    .child(groupId)
    .child(day)
    .once("value")
    .then((data: { val: () => any; }) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err: any) => {
      logger.error("Failed to query database in function: getForDay.", err);
      throw err;
    });
};

const getForRange = async (groupId: any, startDay: any, endDay: any) => {
  return firebaseMessageRef
    .child(groupId)
    .orderByKey()
    .startAt(startDay)
    .endAt(endDay)
    .once("value")
    .then((data: { val: () => any; }) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err: any) => {
      logger.error("Failed to query database in function: getForRange.", err);
      throw err;
    });
};

const remove = async (groupId: any, day: any) => {
  return firebaseMessageRef.child(groupId).child(day).remove();
};

const removeForRange = async (groupId: any, startDay: any, endDay: any) => {
  return firebaseMessageRef.child(groupId).orderByKey().startAt(startDay).endAt(endDay).remove();
};

export { add, get, getForRange, remove, removeForRange };
