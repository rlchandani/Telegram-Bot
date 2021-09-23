import { logger } from "firebase-functions";
import { firebasePinnedMessageRef } from "../helper/dbHelper";

const add = async (groupId: any, messageId: any, message: any, type: any, createdOn: any) =>
  firebasePinnedMessageRef.child(groupId).child(messageId).set({
    type,
    createdOn,
    message
  });

const get = async (groupId: any, messageId: any) => {
  return firebasePinnedMessageRef
    .child(groupId)
    .child(messageId)
    .once("value")
    .then((data: any) => data.val() !== null ? data.val() : null)
    .catch((err: any) => {
      logger.error("Failed to query database in function: getAll.", err);
      throw err;
    });
};

const getByType = async (groupId: any, messageId: any, type: any) => {
  return firebasePinnedMessageRef
    .child(groupId)
    .child(messageId)
    .once("value")
    .then((data: any) => data.val() !== null && data.val().type === type ? data.val() : null)
    .catch((err: any) => {
      logger.error("Failed to query database in function: getByType.", err);
      throw err;
    });
};

const remove = async (groupId: any, messageId: any) => firebasePinnedMessageRef.child(groupId).child(messageId).remove();

export { add, get, getByType, remove };
