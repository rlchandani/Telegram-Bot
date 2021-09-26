import admin from "firebase-admin";
import { logger } from "firebase-functions";
import { firebaseMentionedTickerNormalizedWeeklyRef } from "../helper/dbHelper";
import { MentionedTickerNormalizedWeeklyRecord } from "../model/dao";

const add = async (groupId: any, userId: any, week: any, symbol: any, price: any, createdOn: any): Promise<boolean> => {
  await firebaseMentionedTickerNormalizedWeeklyRef
    .child(groupId)
    .child(week)
    .child(symbol)
    .update({
      total: admin.database.ServerValue.increment(1),
      price: price,
      updatedOn: createdOn
    });
  await firebaseMentionedTickerNormalizedWeeklyRef
    .child(groupId)
    .child(week)
    .child(symbol)
    .child("users")
    .child(userId)
    .update({
      price: parseFloat(price),
      total: admin.database.ServerValue.increment(1)
    });
  return true;
};

const get = async (groupId: any, week: any): Promise<MentionedTickerNormalizedWeeklyRecord> => {
  return firebaseMentionedTickerNormalizedWeeklyRef
    .child(groupId)
    .child(week)
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      logger.error("Failed to query database in function: search.", err);
      throw err;
    });
};

const getTickerBySybolsForGroup = async (groupId: any, symbols = []): Promise<MentionedTickerNormalizedWeeklyRecord[]> => {
  const promises = symbols.map(async (symbol) => {
    try {
      const data = await firebaseMentionedTickerNormalizedWeeklyRef
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
