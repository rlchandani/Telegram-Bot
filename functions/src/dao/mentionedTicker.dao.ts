import { logger } from "firebase-functions";
import { firebaseMentionedTickerRef } from "../helper/dbHelper";
import { MentionedTickerRecord } from "../model/dao";

const add = async (groupId: any, userId: any, day: any, symbol: any, price: any, createdOn: any): Promise<void> => {
  await firebaseMentionedTickerRef.child(groupId).push({
    day: day,
    userId: userId,
    symbol: symbol,
    price: parseFloat(price),
    createdOn: createdOn
  });
};

const getTickerByDayForGroup = async (groupId: any, day: any): Promise<MentionedTickerRecord> => {
  return await firebaseMentionedTickerRef
    .child(groupId)
    .orderByChild("day")
    .equalTo(day)
    .once("value")
    .then((data) => {
      return data.val() !== null ? data.val() : null;
    })
    .catch((err) => {
      logger.error("Failed to query database in function: search.", err);
      throw err;
    });
};

const getTickerByDaysForGroup = async (groupId: any, days: number[] = []): Promise<MentionedTickerRecord[]> => {
  const promises = days.map((day: number) => {
    return firebaseMentionedTickerRef
      .child(groupId)
      .orderByChild("day")
      .equalTo(day)
      .once("value")
      .then((data) => {
        return data.val() !== null ? data.val() : null;
      })
      .catch((err) => {
        logger.error("Failed to query database in function: search.", err);
        throw err;
      });
  });
  return Promise.all(promises).then((snapshots) => {
    return snapshots.filter((p) => p !== null);
  });
};

export { add, getTickerByDayForGroup, getTickerByDaysForGroup };
