import admin from "firebase-admin";
import { logger } from "firebase-functions";
import { firebaseMentionedTickerNormalizedRef } from "../helper/dbHelper";
import { MentionedTickerNormalizedRecord } from "../model/dao/mentionedTickerNormalized.model";

const add = async (groupId: any, userId: any, day: any, symbol: any, price: any, createdOn: any): Promise<boolean> => {
  await firebaseMentionedTickerNormalizedRef
    .child(groupId)
    .child(day)
    .child(symbol)
    .update({
      total: admin.database.ServerValue.increment(1),
      price: price,
      updatedOn: createdOn
    });
  await firebaseMentionedTickerNormalizedRef
    .child(groupId)
    .child(day)
    .child(symbol)
    .child("users")
    .child(userId)
    .update({
      price: parseFloat(price),
      total: admin.database.ServerValue.increment(1)
    });
  return true;
};

const get = async (groupId: any, day: any): Promise<MentionedTickerNormalizedRecord> => {
  return firebaseMentionedTickerNormalizedRef
    .child(groupId)
    .child(day)
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      logger.error("Failed to query database in function: search.", err);
      throw err;
    });
};

const getTickerBySybolsForGroup = async (groupId: any, symbols = []): Promise<MentionedTickerNormalizedRecord[]> => {
  const promises = symbols.map(async (symbol) => {
    try {
      const data = await firebaseMentionedTickerNormalizedRef
        .child(groupId)
        // .child(symbol)
        .once("value");
      return data.val() !== null ? data.val() : null;
    } catch (err) {
      logger.error("Failed to query database in function: search.", err);
      throw err;
    }
  });
  return Promise.all(promises).then((snapshots) => {
    return snapshots.filter((p) => p !== null);
  });
};

export { add, get, getTickerBySybolsForGroup };
