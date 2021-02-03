"use strict";

const functions = require("firebase-functions");
const registeredGroupDao = require("./dao/registeredGroupDao");
const pollDao = require("./dao/pollDao");
const expiringMessageDao = require("./dao/expiringMessageDao");
const calendar = require("./helper/google/calendar");
const { expiringTime } = require("./helper/utils");

exports.registerPoll = async (groupId, pollInfo, requestedBy, date) => {
  try {
    await pollDao.add(groupId, pollInfo, requestedBy, date);
    functions.logger.info(`Poll registered for groupId: ${groupId}`);
  } catch (err) {
    functions.logger.error(`Poll failed to register for groupId: ${groupId}.`, err);
    throw err;
  }
};

exports.getPolls = async (groupId) => {
  const snapshot = await pollDao.getAll(groupId);
  if (snapshot !== null) {
    return snapshot;
  }
  functions.logger.info("No poll(s) found");
  return {};
};

exports.registerExpiringMessage = async (day, groupId, messageId) => {
  try {
    await expiringMessageDao.add(day, groupId, messageId);
    functions.logger.info(`Message registered for groupId: ${groupId} and day: ${day}`);
  } catch (err) {
    functions.logger.error(`Message failed to register for groupId: ${groupId} and day: ${day}`);
    throw err;
  }
};

exports.getExpiringMessageForDay = async (day) => {
  const snapshot = await expiringMessageDao.getAllForDay(day);
  if (snapshot !== null) {
    return snapshot;
  }
  functions.logger.info("No expiring message(s) found");
  return {};
};

exports.deleteExpiringMessageForGroup = async (day, groupId) => {
  await expiringMessageDao.delete(day, groupId);
};

exports.registerGroup = async (groupId, groupInfo, registeredBy, date) => {
  try {
    await registeredGroupDao.add(groupId, groupInfo, registeredBy, date);
    functions.logger.info(`Group registered: ${groupId}`);
  } catch (err) {
    functions.logger.error(`Group failed to register for Id: ${groupId}.`, err);
    throw err;
  }
};

exports.getRegisteredGroups = async () => {
  const snapshot = await registeredGroupDao.getAll();
  if (snapshot !== null) {
    return snapshot;
  }
  functions.logger.info("No group(s) found");
  return {};
};

exports.getRegisteredGroupById = async (groupId) => {
  const snapshot = await registeredGroupDao.get(groupId);
  if (snapshot !== null && snapshot.enabled === true) {
    return snapshot;
  }
  functions.logger.info(`No group found with id: ${groupId}`);
  throw new Error(`No group found with id: ${groupId}`);
};

exports.deRegisteredGroup = async (groupId) => {
  try {
    registeredGroupDao.disable(groupId);
    functions.logger.log("Group deregistered:", groupId);
  } catch (err) {
    functions.logger.error(`Group failed to deregister for Id: ${groupId}.`, err);
    throw err;
  }
};

exports.checkIfGroupExist = async (groupId) => {
  try {
    await this.getRegisteredGroupById(groupId);
    return true;
  } catch (err) {
    return false;
  }
};

exports.sendPollToRegisteredGroups = async (bot, question, options, extra) => {
  const snapshot = await this.getRegisteredGroups();
  Object.keys(snapshot).forEach((groupId) => {
    if (snapshot[groupId].enabled === true) {
      bot.telegram.sendPoll(groupId, question, options, extra);
    }
  });
};

exports.sendMessageToRegisteredGroups = async (bot, messageTest, extra) => {
  const snapshot = await this.getRegisteredGroups();
  Object.keys(snapshot).forEach((groupId) => {
    if (snapshot[groupId].enabled === true) {
      bot.telegram.sendMessage(groupId, messageTest, extra);
    }
  });
};

exports.expireMessages = async (bot) => {
  const deleteMessageRequestList = [];
  const deleteFromTableRequestList = [];

  const date = expiringTime();
  const messages = await this.getExpiringMessageForDay(date);
  for (const [groupId, messagesMap] of Object.entries(messages)) {
    Object.values(messagesMap).forEach((messageId) => {
      functions.logger.info(`Expiring messageId: ${messageId} from groupId: ${groupId}`);
      deleteMessageRequestList.push(bot.telegram.deleteMessage(groupId, messageId));
    });
    deleteFromTableRequestList.push(this.deleteExpiringMessageForGroup(date, groupId));
  }

  Promise.all(deleteMessageRequestList);
  Promise.all(deleteFromTableRequestList);
};

exports.usaHoliday = async (bot, config) => {
  const me = await bot.telegram.getMe();
  const usaEvents = await calendar.getTodayEventUSA(config.google.api_key);
  if (usaEvents.length == 0) {
    functions.logger.info("No USA events found for today");
  }
  usaEvents.forEach((event) => {
    this.sendMessageToRegisteredGroups(
      bot,
      "To all my American friends,\n\nHappy " + event + "!!! 🎊🎉🥂\n\n Best Wishes\n-" + me.first_name
    );
  });
};

exports.indiaHoliday = async (bot, config) => {
  const me = await bot.telegram.getMe();
  const indiaEvents = await calendar.getTodayEventIndia(config.google.api_key);
  if (indiaEvents.length == 0) {
    functions.logger.info("No Indian events found for today");
  }
  indiaEvents.forEach((event) => {
    this.sendMessageToRegisteredGroups(
      bot,
      "To all my Indian friends,\n\nHappy " + event + "!!! 🎊🎉🥂\n\n Best Wishes\n-" + me.first_name
    );
  });
};
