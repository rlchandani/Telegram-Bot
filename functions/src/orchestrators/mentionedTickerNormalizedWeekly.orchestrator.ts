import { logger } from "firebase-functions";
import moment from "moment-timezone";
import { add, getTickerBySybolsForGroup } from "../dao/mentionedTickerNormalizedWeekly.dao";
import { MentionedTickerNormalizedWeeklyRecord } from "../model/dao";

const addMentionedTickerNormalizedWeekly = async (groupId: any, userId: any, tickerSymbol: any, tickerPrice: any, day: any, createdOn: any) => {
  const week = moment.unix(day).tz("America/Los_Angeles").startOf("week").unix();
  try {
    if (await add(groupId, userId, week, tickerSymbol, tickerPrice, createdOn)) {
      logger.info(`Ticker ${tickerSymbol} registered for groupId: ${groupId} by userId: ${userId}`);
    }
  } catch (err) {
    logger.error(`Failed to register ticker for groupId: ${groupId} by userId: ${userId} for week: ${week}.`, err);
    throw err;
  }
};

const getMentionedTickerNormalizedWeeklyBySymbolsForGroup = async (groupId: any, symbols: []): Promise<MentionedTickerNormalizedWeeklyRecord[]> => {
  try {
    const snapshot = await getTickerBySybolsForGroup(groupId, symbols);
    if (snapshot !== null) {
      return snapshot;
    }
    throw new Error(`No data found for symbols: ${symbols} for groupId: ${groupId}`);
  } catch (err) {
    logger.error(`Failed to get data for symbols: ${symbols} for groupId: ${groupId}.`, err);
    throw err;
  }
};

export { addMentionedTickerNormalizedWeekly, getMentionedTickerNormalizedWeeklyBySymbolsForGroup };
