import { logger } from "firebase-functions";
import * as mentionedTickerNormalizedDao from "../dao/mentionedTickerNormalized.dao";
import { MentionedTickerNormalizedRecord } from "../model/dao/mentionedTickerNormalized.model";

const addMentionedTickerNormalized = async (groupId: any, userId: any, tickerSymbol: any, tickerPrice: any, day: any, createdOn: any) => {
  try {
    if (await mentionedTickerNormalizedDao.add(groupId, userId, day, tickerSymbol, tickerPrice, createdOn)) {
      logger.info(`Ticker ${tickerSymbol} registered for groupId: ${groupId} by userId: ${userId}`);
    }
  } catch (err) {
    logger.error(`Failed to register ticker for groupId: ${groupId} by userId: ${userId}.`, err);
    throw err;
  }
};

const getMentionedTickerNormalizedBySymbolsForGroup = async (groupId: any, symbols: []): Promise<MentionedTickerNormalizedRecord[]> => {
  try {
    const snapshot = await mentionedTickerNormalizedDao.getTickerBySybolsForGroup(groupId, symbols);
    if (snapshot !== null) {
      return snapshot;
    }
    throw new Error(`No data found for symbols: ${symbols}`);
  } catch (err) {
    logger.error(`Failed to get data for symbols: ${symbols}.`, err);
    throw err;
  }
};

export { addMentionedTickerNormalized, getMentionedTickerNormalizedBySymbolsForGroup };
