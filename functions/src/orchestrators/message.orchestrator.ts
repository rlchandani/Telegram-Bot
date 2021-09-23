import { logger } from "firebase-functions";
import moment from "moment-timezone";
import * as messageDao from "../dao/message.dao";

const addMessage = async (groupId: any, message: any) => {
  const day = moment().tz("America/Los_Angeles").startOf("day").unix();
  try {
    await messageDao.add(groupId, day, message);
    logger.info(`Added Message with groupId: ${groupId} and day: ${day}`);
  } catch (err) {
    logger.error(`Failed to add Message with groupId: ${groupId} and day: ${day}`);
    throw err;
  }
};

const getMessage = async (groupId: any, day: any) => {
  const snapshot = await messageDao.get(groupId, day);
  if (snapshot !== null) {
    return snapshot;
  }
  logger.warn(`No message(s) found with groupId: ${groupId} and day: ${day}`);
  return {};
};

const getMessageForRange = async (groupId: any, startDay: any, endDay: any) => {
  const snapshot = await messageDao.getForRange(groupId, startDay, endDay);
  if (snapshot !== null) {
    return snapshot;
  }
  logger.warn(`No message(s) found with groupId: ${groupId}, startDay: ${startDay} and endDay: ${endDay}`);
  return {};
};

const removeMessage = async (groupId: any, day: any) => {
  logger.log(`Deleting Messages with groupId: ${groupId} and day: ${day}`);
  await messageDao.remove(groupId, day);
};

const removeMessageForRange = async (groupId: any, startDay: any, endDay: any) => {
  logger.log(`Deleting Messages with groupId: ${groupId}, startDay: ${startDay} and endDay: ${endDay}`);
  await messageDao.removeForRange(groupId, startDay, endDay);
};

export { addMessage, getMessage, getMessageForRange, removeMessage, removeMessageForRange };
