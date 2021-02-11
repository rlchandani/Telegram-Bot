"use strict";

const functions = require("firebase-functions");
const registeredGroupDao = require("./dao/registeredGroupDao");
const registeredUserDao = require("./dao/registeredUserDao");
const pollDao = require("./dao/pollDao");
const expiringMessageDao = require("./dao/expiringMessageDao");
const mentionedTickerDao = require("./dao/mentionedTickerDao");
const calendar = require("./helper/google/calendar");
const utils = require("./helper/utils");
const timeUtil = require("./helper/timeUtil");
const reporter = require("./helper/reporter");
const moment = require("moment-timezone");

/** *********************** MentiondTickerDao orchestrator ************************ */

exports.registerMentionedTicker = async (groupId, userId, tickerSymbol, tickerPrice) => {
  try {
    await mentionedTickerDao.add(
      groupId,
      userId,
      moment().tz("America/Los_Angeles").startOf("day").unix(),
      tickerSymbol,
      tickerPrice,
      moment().tz("America/Los_Angeles").unix()
    );
    functions.logger.info(`Ticker ${tickerSymbol} registered for groupId: ${groupId} by userId: ${userId}`);
  } catch (err) {
    functions.logger.error(`Failed to register ticker for groupId: ${groupId} by userId: ${userId}.`, err);
    throw err;
  }
};

exports.getMentionedTickerByDaysForGroup = async (groupId, days) => {
  try {
    const snapshot = await mentionedTickerDao.getTickerByDaysForGroup(groupId, days);
    if (snapshot !== null) {
      return snapshot;
    }
    throw new Error(`No data found for days: ${days}`);
  } catch (err) {
    functions.logger.error(`Failed to get data for days: ${days}.`, err);
    throw err;
  }
};

/** *********************** PollDao orchestrator ************************ */

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

/** *********************** ExpiringMessageDao orchestrator ************************ */

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

/** *********************** RegisteredGroupDao orchestrator ************************ */

exports.registerGroup = async (groupId, groupInfo, registeredBy, date, enabled) => {
  try {
    if (await registeredGroupDao.add(groupId, groupInfo, registeredBy, date, enabled)) {
      functions.logger.info(`Group registered: ${groupId}`);
    }
  } catch (err) {
    functions.logger.error(`Group failed to register for Id: ${groupId}.`, err);
    throw err;
  }
};

exports.getRegisteredGroups = async () => {
  const snapshot = await registeredGroupDao.getAll();
  if (snapshot !== null) {
    return Object.keys(snapshot)
      .filter((groupId) => snapshot[groupId].enabled == true)
      .map((groupId) => snapshot[groupId]);
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

/** *********************** RegisteredUserDao orchestrator ************************ */

exports.registerUser = async (userId, userInfo, date) => {
  try {
    if (await registeredUserDao.add(userId, userInfo, date)) {
      functions.logger.info(`User registered: ${userId}`);
    }
  } catch (err) {
    functions.logger.error(`User failed to register for Id: ${userId}.`, err);
    throw err;
  }
};

exports.getRegisteredUsers = async () => {
  const snapshot = await registeredUserDao.getAll();
  if (snapshot !== null) {
    return snapshot;
  }
  functions.logger.info("No user(s) found");
  return {};
};

exports.getRegisteredUserById = async (userId) => {
  const snapshot = await registeredUserDao.get(userId);
  if (snapshot !== null && snapshot.enabled === true) {
    return snapshot;
  }
  functions.logger.info(`No user found with id: ${userId}`);
  throw new Error(`No user found with id: ${userId}`);
};

exports.deRegisteredUser = async (userId) => {
  try {
    registeredUserDao.disable(userId);
    functions.logger.log("User deregistered:", userId);
  } catch (err) {
    functions.logger.error(`User failed to deregister for Id: ${userId}.`, err);
    throw err;
  }
};

exports.checkIfUserExist = async (userId) => {
  try {
    await this.getRegisteredUserById(userId);
    return true;
  } catch (err) {
    return false;
  }
};

/** *********************** Send Message Wrapper ************************ */

exports.sendPollToRegisteredGroups = async (bot, question, options, extra) => {
  const snapshot = await this.getRegisteredGroups();
  const promises = [];
  snapshot.forEach((group) => {
    if (group.enabled === true) {
      functions.logger.info(`Sending poll to ${group.id}`);
      promises.push(bot.telegram.sendPoll(group.id, question, options, extra));
    }
  });
  await Promise.all(promises);
};

exports.sendMessageToRegisteredGroups = async (bot, messageTest, extra) => {
  const snapshot = await this.getRegisteredGroups();
  const promises = [];
  snapshot.forEach((group) => {
    if (group.enabled === true && messageTest) {
      functions.logger.info(`Sending message to ${group.id}`);
      promises.push(bot.telegram.sendMessage(group.id, messageTest, extra));
    }
  });
  await Promise.all(promises);
};

/** *********************** Expire Message Wrapper ************************ */

exports.expireMessages = async (bot) => {
  const deleteMessageRequestList = [];
  const deleteFromTableRequestList = [];

  const date = timeUtil.expiringTime();
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

/** *********************** Send Message on Holidays Wrapper ************************ */

exports.usaHoliday = async (bot, config) => {
  const me = await bot.telegram.getMe();
  const usaEvents = await calendar.getTodayEventUSA(config.google.api_key);
  if (usaEvents.length == 0) {
    functions.logger.info("No USA events found for today");
  }
  usaEvents.forEach((event) => {
    this.sendMessageToRegisteredGroups(bot, "To all my American friends,\n\nHappy " + event + "!!! 🎊🎉🥂\n\n Best Wishes\n-" + me.first_name);
  });
};

exports.indiaHoliday = async (bot, config) => {
  const me = await bot.telegram.getMe();
  const indiaEvents = await calendar.getTodayEventIndia(config.google.api_key);
  if (indiaEvents.length == 0) {
    functions.logger.info("No Indian events found for today");
  }
  indiaEvents.forEach((event) => {
    this.sendMessageToRegisteredGroups(bot, "To all my Indian friends,\n\nHappy " + event + "!!! 🎊🎉🥂\n\n Best Wishes\n-" + me.first_name);
  });
};

/** *********************** Report Wrapper ************************ */

exports.sendReportForTopMentionedByPerformanceToGroups = async (bot, overrideGroupId) => {
  const promises = [];
  const groups = await this.getRegisteredGroups();
  groups.forEach(async (group) => promises.push(_sendReportForTopMentionedByPerformanceToGroups(bot, group, overrideGroupId)));
  await Promise.all(promises);
};

const _sendReportForTopMentionedByPerformanceToGroups = async (bot, group, overrideGroupId) => {
  const topMentionedTickersByPerformance = await reporter.getTopMentionedTickersByPerformance(
    group.id,
    timeUtil.currentWeekDays("America/Los_Angeles")
  );
  const messageText = topMentionedTickersByPerformance.slice(0, 5).map((item, index) => {
    return (
      `*Ticker:* [${item.symbol}](https://robinhood.com/stocks/${item.symbol})\n` +
      `*First Mentioned:* ${moment.unix(item.day).format("YYYY-MM-DD")} ($${item.first_mentioned_price})\n` +
      `*Current Price:* $${item.last_trade_price}\n` +
      `*Total P/L:* $${item.pl} (${item.pl_percentage}%) ${utils.getPriceMovementIcon(item.pl)}\n`
    );
  });
  const groupName = group.type == "group" ? group.title : group.first_name;
  const headerText = `*Weekly Report:*\n*Group Name: ${groupName}*\nPerformance of top 5 mentioned stocks this week:\n`;
  return bot.telegram.sendMessage(overrideGroupId || group.id, headerText + messageText.join("\n"), {
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  });
};

exports.sendReportForTopMentionedByCountToGroups = async (bot, overrideGroupId) => {
  const promises = [];
  const groups = await this.getRegisteredGroups();
  groups.forEach(async (group) => promises.push(_sendReportForTopMentionedByCountToGroups(bot, group, overrideGroupId)));
  await Promise.all(promises);
};

const _sendReportForTopMentionedByCountToGroups = async (bot, group, overrideGroupId) => {
  const topMentionedTickerByCount = await reporter.getTopMentionedTickersByCount(group.id, timeUtil.currentWeekDays("America/Los_Angeles"));
  const messageText = Object.keys(topMentionedTickerByCount)
    .slice(0, 5)
    .map((symbol, index) => {
      const count = topMentionedTickerByCount[symbol];
      return `${count} - [${symbol}](https://robinhood.com/stocks/${symbol})`;
    });
  const groupName = group.type == "group" ? group.title : group.first_name;
  const headerText = `*Weekly Report:*\n*Group Name: ${groupName}*\nFollowing stocks are being talked about in this week:\n`;
  return await bot.telegram.sendMessage(overrideGroupId || group.id, headerText + messageText.join("\n"), {
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  });
};
