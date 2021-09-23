import { logger } from "firebase-functions";
import * as pollDao from "../dao/poll.dao";

const addPoll = async (groupId: any, pollInfo: any, requestedBy: any, date: any) => {
  try {
    await pollDao.add(groupId, pollInfo, requestedBy, date);
    logger.info(`Poll registered for groupId: ${groupId}`);
  } catch (err) {
    logger.error(`Poll failed to register for groupId: ${groupId}.`, err);
    throw err;
  }
};

const getPolls = async (groupId: any) => {
  const snapshot = await pollDao.getAll(groupId);
  if (snapshot !== null) {
    return snapshot;
  }
  logger.info("No poll(s) found");
  return {};
};

export { addPoll, getPolls };
