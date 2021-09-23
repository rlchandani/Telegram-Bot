import { logger } from "firebase-functions";
import moment from "moment-timezone";
import { add, getTickerByDayForGroup, getTickerByDaysForGroup } from "../dao/mentionedTicker.dao";
import { MentionedTickerRecord } from "../model/dao/mentionedTickerRecord.model";

const addMentionedTicker = async (groupId: number, userId: number, tickerSymbol: string, tickerPrice: number): Promise<void> => {
  try {
    await add(
      groupId,
      userId,
      moment().tz("America/Los_Angeles").startOf("day").unix(),
      tickerSymbol,
      tickerPrice,
      moment().tz("America/Los_Angeles").unix()
    );
    logger.info(`Ticker ${tickerSymbol} registered for groupId: ${groupId} by userId: ${userId}`);
  } catch (err) {
    logger.error(`Failed to register ticker for groupId: ${groupId} by userId: ${userId}.`, err);
    throw err;
  }
};

const getMentionedTickerByDayForGroup = async (groupId: number, day: number): Promise<MentionedTickerRecord> => {
  try {
    const snapshot = await getTickerByDayForGroup(groupId, day);
    if (snapshot !== null) {
      return snapshot;
    }
    throw new Error(`No data found for day: ${day}`);
  } catch (err) {
    logger.error(`Failed to get data for day: ${day}.`, err);
    throw err;
  }
};

const getMentionedTickerByDaysForGroup = async (groupId: any, days: number[]): Promise<MentionedTickerRecord[]> => {
  try {
    const snapshot = await getTickerByDaysForGroup(groupId, days);
    if (snapshot !== null) {
      return snapshot;
    }
    throw new Error(`No data found for days: ${days}`);
  } catch (err) {
    logger.error(`Failed to get data for days: ${days}.`, err);
    throw err;
  }
};

export { addMentionedTicker, getMentionedTickerByDayForGroup, getMentionedTickerByDaysForGroup };
