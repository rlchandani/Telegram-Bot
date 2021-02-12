"use strict";

const functions = require("firebase-functions");
const registeredGroupDao = require("./dao/registeredGroupDao");
const registeredUserDao = require("./dao/registeredUserDao");
const pollDao = require("./dao/pollDao");
const expiringMessageDao = require("./dao/expiringMessageDao");
const mentionedTickerDao = require("./dao/mentionedTickerDao");
const watchlistDao = require("./dao/watchlistDao");
const calendar = require("./helper/google/calendar");
const utils = require("./helper/utils");
const timeUtil = require("./helper/timeUtil");
const reporter = require("./helper/reporter");
const messageAction = require("./model/message_action");
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

/** *********************** WatchlishDao orchestrator ************************ */

exports.addToWatchlist = async (groupId, tickerSymbol, tickerPrice, userId) => {
  try {
    await watchlistDao.add(groupId, tickerSymbol, tickerPrice, userId, moment().tz("America/Los_Angeles").unix());
    functions.logger.info(`Ticker ${tickerSymbol} added to watchlist for groupId: ${groupId} by userId: ${userId}`);
  } catch (err) {
    functions.logger.error(`Failed to add ticker to watchlist for groupId: ${groupId} by userId: ${userId}.`, err);
    throw err;
  }
};

exports.getWatchlistForGroup = async (groupId) => {
  try {
    const snapshot = await watchlistDao.getWatchlistForGroup(groupId);
    if (snapshot !== null) {
      return snapshot;
    }
    return [];
  } catch (err) {
    functions.logger.error(`Failed to get data for groupId: ${groupId}.`, err);
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

exports.registerExpiringMessage = async (day, groupId, messageId, action) => {
  try {
    await expiringMessageDao.add(day, groupId, messageId, action);
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
  functions.logger.info(`No expiring message(s) found for day: ${day}`);
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
  snapshot.forEach(async (group) => promises.push(_sendPollToRegisteredGroups(bot, question, options, extra, group)));
  await Promise.all(promises);
};

const _sendPollToRegisteredGroups = async (bot, question, options, extra, group) => {
  if (group.enabled === true) {
    functions.logger.info(`Sending poll to ${group.id}`);
    const replyMessage = await bot.telegram.sendPoll(group.id, question, options, extra);
    try {
      await this.pinChatMessage(group.id, replyMessage.message_id);
      await this.registerExpiringMessage(timeUtil.nowHour(), replyMessage.chat.id, replyMessage.message_id, messageAction.UNPIN);
    } catch (err) {
      console.error(`Failed to pin messageId: ${replyMessage.message_id} to groupId: ${group.id}`, err);
    }
  }
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
  const promises = [];

  const expiringHours = [4, 24];
  expiringHours.forEach(async (hour) => promises.push(_expireMessages(bot, hour)));

  await Promise.all(promises);
};

const _expireMessages = async (bot, hour) => {
  const actionRequestList = [];
  const deleteFromTableRequestList = [];

  const date = timeUtil.expiringTime(hour);
  const messages = await this.getExpiringMessageForDay(date);
  for (const [groupId, messagesMap] of Object.entries(messages)) {
    Object.values(messagesMap).forEach((message) => {
      switch (message.action) {
      case messageAction.DELETE:
        if (hour == 24) {
          functions.logger.info(`Expiring messageId: ${message.messageId} from groupId: ${groupId} with action: ${message.action}`);
          actionRequestList.push(this.deleteMessage(bot, groupId, message.messageId));
        }
        break;
      case messageAction.UNPIN:
        if (hour == 2) {
          functions.logger.info(`Expiring messageId: ${message.messageId} from groupId: ${groupId} with action: ${message.action}`);
          actionRequestList.push(this.unpinChatMessage(bot, groupId, message.messageId));
        }
        break;
      default:
        console.log(`Expiring message action not defined. Action: ${message.action}`);
      }
    });
    deleteFromTableRequestList.push(this.deleteExpiringMessageForGroup(date, groupId));
  }

  await Promise.all(actionRequestList);
  await Promise.all(deleteFromTableRequestList);
};

exports.deleteMessage = async (bot, groupId, messageId) => {
  try {
    await bot.telegram.deleteMessage(groupId, messageId);
  } catch (err) {
    console.error(`Failed to delete messageId: ${messageId} from groupId: ${groupId}`, err.message);
  }
};

exports.pinChatMessage = async (bot, groupId, messageId) => {
  try {
    await bot.telegram.pinChatMessage(groupId, messageId);
  } catch (err) {
    console.error(`Failed to pin messageId: ${messageId} from groupId: ${groupId}`, err.message);
  }
};

exports.unpinChatMessage = async (bot, groupId, messageId) => {
  try {
    await bot.telegram.unpinChatMessage(groupId, messageId);
  } catch (err) {
    console.error(`Failed to unpin messageId: ${messageId} from groupId: ${groupId}`, err.message);
  }
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

exports.sendReportForWatchlistByPerformanceToGroups = async (bot, groupId) => {
  try {
    const group = await this.getRegisteredGroupById(groupId);
    const watchlistTickersByPerformance = await reporter.getWatchlistTickersByPerformance(group.id);
    const messageText = watchlistTickersByPerformance.slice(0, 10).map((item, index) => {
      return (
        `*Ticker:* [${item.symbol}](https://robinhood.com/stocks/${item.symbol})\n` +
        `*Added On:* \`\`\`${moment.unix(item.first_mentioned_on).format("YYYY-MM-DD")}\`\`\` ($${item.first_mentioned_price})\n` +
        `*Current Price:* \`\`\`$${item.last_trade_price}\`\`\`\n` +
        `*Total P/L:* \`\`\`$${item.pl}\`\`\` (${item.pl_percentage}%) ${utils.getPriceMovementIcon(item.pl)}\n`
      );
    });
    if (messageText.length > 0) {
      const groupName = group.type == "group" ? group.title : group.first_name;
      const headerText = `*Watchlist Status:* ${groupName}\nTop 10 performaning stocks from watchlist:\n\n`;
      await bot.telegram.sendMessage(group.id, headerText + messageText.join("\n"), {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });
    } else {
      await bot.telegram.sendMessage(groupId, "Watchlist is empty!", {
        parse_mode: "Markdown",
      });
    }
  } catch (err) {
    await bot.telegram.sendMessage(groupId, "Group is not registered to receive response.\nPlease register using /register", {
      parse_mode: "Markdown",
    });
  }
};

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
