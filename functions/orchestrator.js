"use strict";

const functions = require("firebase-functions");
const registeredGroupDao = require("./dao/registeredGroupDao");

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
