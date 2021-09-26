import { logger } from "firebase-functions";
import { add, getTickerBySybolsForGroup } from "../dao/mentionedTickerNormalizedDaily.dao";
import { MentionedTickerNormalizedRecord } from "../model/dao";

const addMentionedTickerNormalizedDaily = async (groupId: any, userId: any, tickerSymbol: any, tickerPrice: any, day: any, createdOn: any) => {
  try {
    if (await add(groupId, userId, day, tickerSymbol, tickerPrice, createdOn)) {
      logger.info(`Ticker ${tickerSymbol} registered for groupId: ${groupId} by userId: ${userId}`);
    }
  } catch (err) {
    logger.error(`Failed to register ticker for groupId: ${groupId} by userId: ${userId} for day ${day}.`, err);
    throw err;
  }
};

const getMentionedTickerNormalizedDailyBySymbolsForGroup = async (groupId: any, symbols: []): Promise<MentionedTickerNormalizedRecord[]> => {
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

export { addMentionedTickerNormalizedDaily, getMentionedTickerNormalizedDailyBySymbolsForGroup };
