import { logger } from "firebase-functions";
import * as watchlistDao from "../dao/watchlist.dao";
import moment from "moment-timezone";

const addToWatchlist = async (groupId: any, userId: any, tickerSymbol: any, tickerPrice: any) => {
  try {
    await watchlistDao.add(groupId, tickerSymbol, tickerPrice, userId, moment().tz("America/Los_Angeles").unix());
    logger.info(`Ticker ${tickerSymbol} added to watchlist for groupId: ${groupId} by userId: ${userId}`);
  } catch (err) {
    logger.error(`Failed to add ticker to watchlist for groupId: ${groupId} by userId: ${userId}.`, err);
    throw err;
  }
};

const getWatchlistForGroup = async (groupId: any) => {
  try {
    const snapshot = await watchlistDao.getWatchlistForGroup(groupId);
    if (snapshot !== null) {
      return snapshot;
    }
    return [];
  } catch (err) {
    logger.error(`Failed to get data for groupId: ${groupId}.`, err);
    throw err;
  }
};

export { addToWatchlist, getWatchlistForGroup };
