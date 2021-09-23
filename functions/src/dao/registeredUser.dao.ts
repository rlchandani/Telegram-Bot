import { logger } from "firebase-functions";
import { firebaseRegisteredUsersRef } from "../helper/dbHelper";

const add = async (userId: any, userInfo: any, date: any) => {
  const snapshot = await get(userId);
  if (snapshot === null || snapshot.first_name !== userInfo.first_name) {
    userInfo.enabled = true;
    userInfo.created_at = snapshot !== null ? snapshot.created_at : date;
    userInfo.updated_at = date;
    await firebaseRegisteredUsersRef.child(userId).set(userInfo);
    return true;
  }
  return false;
};

const getAll = async () => {
  return firebaseRegisteredUsersRef
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      logger.error("Failed to query database in function: getAll.", err);
      throw err;
    });
};

const get = async (userId: any) => {
  return firebaseRegisteredUsersRef
    .child(userId)
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      logger.error("Failed to query database in function: get.", err);
      throw err;
    });
};

const enable = async (userId: any) => {
  return firebaseRegisteredUsersRef.child(userId).child("enabled").set(true);
};

const disable = async (userId: any) => {
  return firebaseRegisteredUsersRef.child(userId).child("enabled").set(false);
};

const remove = async (userId: any) => {
  return firebaseRegisteredUsersRef.child(userId).remove();
};

const purge = async () => {
  return firebaseRegisteredUsersRef.remove();
};

export { add, getAll, get, enable, disable, remove, purge };
