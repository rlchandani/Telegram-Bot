import { logger } from "firebase-functions";
import moment from "moment-timezone";
import { expireIn24Hours } from "../helper/timeUtil";
import * as expiringMessageDao from "../dao/expiringMessage.dao";

const addExpiringMessage = async (groupId: any, messageId: any, action: any, expiringTime = expireIn24Hours()) => {
  try {
    await expiringMessageDao.add(groupId, messageId, action, expiringTime.unix());
    logger.info(`Registered: Expiring Message with messageId: ${messageId}, groupId: ${groupId} and expiring time: ${expiringTime.unix()}`);
  } catch (err) {
    logger.error(`Registration Failed: Expiring Message with messageId: ${messageId}, groupId: ${groupId} and expiring time: ${expiringTime.unix()}`);
    throw err;
  }
};

const getExpiringMessages = async (overrideEndHour = 0) => {
  const currentHour = moment().tz("America/Los_Angeles").set({
    minute: 0,
    second: 0,
    millisecond: 0
  });
  const start = currentHour.clone().subtract(24, "hour").unix().toString();
  const end = currentHour.clone().add(overrideEndHour, "hour").unix().toString(); // TODO
  const snapshot = await expiringMessageDao.get(start, end);
  if (snapshot !== null) {
    return snapshot;
  }
  logger.info(`No expiring message(s) found for period between ${start} and ${end}`);
  return {};
};

const removeExpiringMessageForGroup = async (expiringTime: any, groupId: any) => {
  logger.log(`Deleting expired messages from table for expiringTime: ${expiringTime} and group: ${groupId}`);
  await expiringMessageDao.remove(expiringTime, groupId);
};

export { addExpiringMessage, getExpiringMessages, removeExpiringMessageForGroup };
