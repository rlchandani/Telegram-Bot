import { logger } from "firebase-functions";
import moment from "moment-timezone";
import * as pinnedMessageDao from "../dao/pinnedMessage.dao";

const addPinnedMessage = async (groupId: any, messageId: any, message: any, type: any) => {
  try {
    await pinnedMessageDao.add(groupId, messageId, message, type, moment().tz("America/Los_Angeles").unix());
    logger.info(`Registered: Pinned Message with groupId: ${groupId} and messageId: ${messageId}`);
  } catch (err) {
    logger.error(`Registration Failed: Pinned Message with groupId: ${groupId} and messageId: ${messageId}`);
    throw err;
  }
};

const getPinnedMessage = async (groupId: any, messageId: any) => {
  const snapshot = await pinnedMessageDao.get(groupId, messageId);
  if (snapshot !== null) {
    return snapshot;
  }
  logger.info(`No pineed message(s) found for groupId: ${groupId} and messageId: ${messageId}`);
  return {};
};

const getPinnedMessageWithType = async (groupId: any, messageId: any, type: any) => {
  const snapshot = await pinnedMessageDao.getByType(groupId, messageId, type);
  if (snapshot !== null) {
    return snapshot;
  }
  logger.info(`No pineed message(s) found for groupId: ${groupId}, messageId: ${messageId} and type: ${type}`);
  return {};
};

const removePinnedMessageForGroup = async (groupId: any, messageId: any) => {
  logger.log(`Deleting pinned messages from table for groupId: ${groupId} and messageId: ${messageId}`);
  await pinnedMessageDao.remove(groupId, messageId);
};

export { addPinnedMessage, getPinnedMessage, getPinnedMessageWithType, removePinnedMessageForGroup };
