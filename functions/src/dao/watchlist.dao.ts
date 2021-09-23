import { logger } from "firebase-functions";
import { firebaseWatchlistRef } from "../helper/dbHelper";

const add = async (groupId: any, symbol: any, price: any, userId: any, createdOn: any) => {
  firebaseWatchlistRef
    .child(groupId)
    .child(symbol)
    .push({
      groupId: groupId,
      symbol: symbol,
      price: parseFloat(price),
      userId: userId,
      createdOn: createdOn
    });
};

const getWatchlistForGroup = async (groupId: any) => {
  return firebaseWatchlistRef
    .child(groupId)
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      logger.error("Failed to query database in function: search.", err);
      throw err;
    });
};

export { add, getWatchlistForGroup };
