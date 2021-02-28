"use strict";

const functions = require("firebase-functions");
const { firebaseConfig } = require("./helper/firebase_config");
const registeredGroupDao = require("./dao/registeredGroupDao");
const registeredUserDao = require("./dao/registeredUserDao");
const pollDao = require("./dao/pollDao");
const expiringMessageDao = require("./dao/expiringMessageDao");
const mentionedTickerDao = require("./dao/mentionedTickerDao");
const mentionedTickerNormalizedDao = require("./dao/mentionedTickerNormalizedDao");
const watchlistDao = require("./dao/watchlistDao");
const calendar = require("./helper/google/calendar");
const { getPriceMovementIcon } = require("./helper/utils");
const timeUtil = require("./helper/timeUtil");
const reporter = require("./helper/reporter");
const messageAction = require("./model/message_action");
const registerAction = require("./model/register_action");
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

exports.getMentionedTickerByDayForGroup = async (groupId, day) => {
  try {
    const snapshot = await mentionedTickerDao.getTickerByDayForGroup(groupId, day);
    if (snapshot !== null) {
      return snapshot;
    }
    functions.logger.error(`No data found for day: ${day}.`);
  } catch (err) {
    functions.logger.error(`Failed to get data for day: ${day}.`, err);
    throw err;
  }
  return {};
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

/** *********************** MentiondTickerNormalizedDao orchestrator ************************ */

exports.registerMentionedTickerNormalized = async (groupId, userId, tickerSymbol, tickerPrice, day, createdOn) => {
  try {
    if (await mentionedTickerNormalizedDao.add(groupId, userId, day, tickerSymbol, tickerPrice, createdOn)) {
      functions.logger.info(`Ticker ${tickerSymbol} registered for groupId: ${groupId} by userId: ${userId}`);
    }
  } catch (err) {
    functions.logger.error(`Failed to register ticker for groupId: ${groupId} by userId: ${userId}.`, err);
    throw err;
  }
};

exports.getMentionedTickerNormalizedBySymbolsForGroup = async (groupId, symbols) => {
  try {
    const snapshot = await mentionedTickerNormalizedDao.getTickerBySybolsForGroup(groupId, symbols);
    if (snapshot !== null) {
      return snapshot;
    }
    throw new Error(`No data found for symbols: ${symbols}`);
  } catch (err) {
    functions.logger.error(`Failed to get data for symbols: ${symbols}.`, err);
    throw err;
  }
};

/** *********************** WatchlishDao orchestrator ************************ */

exports.addToWatchlist = async (groupId, userId, tickerSymbol, tickerPrice) => {
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

exports.registerExpiringMessage = async (groupId, messageId, action, expiringTime = timeUtil.expireIn24Hours()) => {
  try {
    await expiringMessageDao.add(groupId, messageId, action, expiringTime.unix());
    functions.logger.info(`Message registered for groupId: ${groupId} with expiring time: ${expiringTime.unix()}`);
  } catch (err) {
    functions.logger.error(`Message failed to register for groupId: ${groupId} with expiring time: ${expiringTime.unix()}`);
    throw err;
  }
};

exports.getExpiringMessages = async (overrideEndHour = 0) => {
  const currentHour = moment().tz("America/Los_Angeles").set({ minute: 0, second: 0, millisecond: 0 });
  const start = currentHour.clone().subtract(24, "hour").unix().toString();
  const end = currentHour.clone().add(overrideEndHour, "hour").unix().toString(); // TODO
  const snapshot = await expiringMessageDao.get(start, end);
  if (snapshot !== null) {
    return snapshot;
  }
  functions.logger.info(`No expiring message(s) found for period between ${start} and ${end}`);
  return {};
};

exports.deleteExpiringMessageForGroup = async (expiringTime, groupId) => {
  functions.logger.log(`Deleting expired messages from table for expiringTime: ${expiringTime} and group: ${groupId}`);
  await expiringMessageDao.delete(expiringTime, groupId);
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

exports.getRegisteredGroups = async (filterOnService) => {
  const snapshot = await registeredGroupDao.getAll();
  if (snapshot !== null) {
    if (filterOnService !== undefined) {
      return Object.keys(snapshot)
        .filter((groupId) => {
          const group = snapshot[groupId];
          return group.service != undefined && group.service[filterOnService] == true;
        })
        .map((groupId) => snapshot[groupId]);
    } else {
      return Object.keys(snapshot)
        .filter((groupId) => snapshot[groupId].enabled == true)
        .map((groupId) => snapshot[groupId]);
    }
  }
  functions.logger.info("No group(s) found");
  return [];
};

exports.getRegisteredGroupById = async (groupId) => {
  const snapshot = await registeredGroupDao.get(groupId);
  if (snapshot !== null) {
    return snapshot;
  }
  functions.logger.info(`No group found with id: ${groupId}`);
  return {};
};

exports.deRegisteredGroup = async (groupId) => {
  const promises = [];
  registerAction.registerOptions.forEach((optionGroup) =>
    optionGroup.forEach((option) => {
      promises.push(this.disableService(groupId, option.action));
    })
  );
  await Promise.all(promises);
};

exports.enableService = async (groupId, serviceName) => {
  try {
    registeredGroupDao.enableService(groupId, serviceName);
    functions.logger.log(`Service ${serviceName} enabled on groupId:`, groupId);
  } catch (err) {
    functions.logger.error(`Group failed to enable service: ${serviceName} for Id: ${groupId}.`, err);
    throw err;
  }
};

exports.disableService = async (groupId, serviceName) => {
  try {
    registeredGroupDao.disableService(groupId, serviceName);
    functions.logger.log(`Service ${serviceName} disabled on groupId:`, groupId);
  } catch (err) {
    functions.logger.error(`Group failed to disable service: ${serviceName} for Id: ${groupId}.`, err);
    throw err;
  }
};

exports.getRegisteredGroupServiceStatus = async (groupId) => {
  const group = await this.getRegisteredGroupById(groupId);
  const services = group.service;
  const response = {};
  registerAction.registerOptions.forEach((optionGroup) =>
    optionGroup.forEach((option) => {
      if (services === undefined) {
        response[option.name] = "Disabled";
      } else {
        response[option.name] = services[option.action] === false || services[option.action] === undefined ? "Disabled" : "Enabled";
      }
    })
  );
  return response;
};

exports.checkIfServiceActiveOnRegisteredGroup = async (groupId, serviceName) => {
  const group = await this.getRegisteredGroupById(groupId);
  const services = group.service;
  if (services != undefined && services[serviceName] != null && services[serviceName] == true) {
    return true;
  }
  return false;
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
  const snapshot = await this.getRegisteredGroups("scheduled_polls");
  const promises = [];
  snapshot.forEach(async (group) => promises.push(_sendPollToRegisteredGroups(bot, question, options, extra, group)));
  await Promise.all(promises);
};

const _sendPollToRegisteredGroups = async (bot, question, options, extra, group) => {
  functions.logger.info(`Sending poll to ${group.id}`);
  const replyMessage = await bot.telegram.sendPoll(group.id, question, options, extra);
  try {
    await this.pinChatMessage(bot, group.id, replyMessage.message_id);
    await this.registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.UNPIN, timeUtil.expireIn3Hours());
  } catch (err) {
    console.error(`Failed to pin messageId: ${replyMessage.message_id} to groupId: ${group.id}`, err);
  }
};

exports.sendMessageToRegisteredGroups = async (bot, groupFilter, messageTest, extra) => {
  const snapshot = await this.getRegisteredGroups(groupFilter);
  const promises = [];
  snapshot.forEach((group) => {
    if (messageTest) {
      functions.logger.info(`Sending message to ${group.id}`);
      promises.push(bot.telegram.sendMessage(group.id, messageTest, extra));
    }
  });
  await Promise.all(promises);
};

/** *********************** Expire Message Wrapper ************************ */

exports.expireMessages = async (bot, overrideEndHour = 0) => {
  const actionRequestList = [];
  const deleteFromTableRequestList = [];

  const messages = await this.getExpiringMessages(overrideEndHour);
  for (const [expiringTime, groupWithMessages] of Object.entries(messages)) {
    for (const [groupId, messages] of Object.entries(groupWithMessages)) {
      functions.logger.info(`Expiring messages for time: ${expiringTime} and groupId: ${groupId}`);
      Object.values(messages).forEach((message) => {
        switch (message.action) {
          case messageAction.DELETE:
            functions.logger.info(`Expiring messageId: ${message.messageId} for action: ${message.action}`);
            actionRequestList.push(this.deleteMessage(bot, groupId, message.messageId));
            break;
          case messageAction.UNPIN:
            functions.logger.info(`Expiring messageId: ${message.messageId} for action: ${message.action}`);
            actionRequestList.push(this.unpinChatMessage(bot, groupId, message.messageId));
            break;
          default:
            functions.logger.log(`Expiring message action not defined. Action: ${message.action}`);
        }
      });
      deleteFromTableRequestList.push(this.deleteExpiringMessageForGroup(expiringTime, groupId));
    }
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

exports.usaHoliday = async (bot) => {
  const me = await bot.telegram.getMe();
  const usaEvents = await calendar.getTodayEventUSA(firebaseConfig.google.api_key);
  if (usaEvents.length == 0) {
    functions.logger.info("No USA events found for today");
  }
  usaEvents.forEach((event) => {
    this.sendMessageToRegisteredGroups(
      bot,
      "holiday_events_usa",
      "To all my American friends,\n\nHappy " + event + "!!! 🎊🎉🥂\n\n Best Wishes\n-" + me.first_name
    );
  });
};

exports.indiaHoliday = async (bot) => {
  const me = await bot.telegram.getMe();
  const indiaEvents = await calendar.getTodayEventIndia(firebaseConfig.google.api_key);
  if (indiaEvents.length == 0) {
    functions.logger.info("No Indian events found for today");
  }
  indiaEvents.forEach((event) => {
    this.sendMessageToRegisteredGroups(
      bot,
      "holiday_events_india",
      "To all my Indian friends,\n\nHappy " + event + "!!! 🎊🎉🥂\n\n Best Wishes\n-" + me.first_name
    );
  });
};

/** *********************** Report Wrapper ************************ */

exports.sendReportForWatchlistByPerformanceToGroups = async (bot, groupId) => {
  try {
    const group = await this.getRegisteredGroupById(groupId);
    const watchlistTickersByPerformance = await reporter.getWatchlistTickersByPerformance(group.id);
    const messageText = watchlistTickersByPerformance.slice(0, 10).map((item, index) => {
      return (
        `*Ticker:* [${item.symbol}](https://robinhood.com/stocks/${item.symbol}) ${item.country_flag} (${item.country})\n` +
        `*Sector:* ${item.sector}\n` +
        `*Added On:* \`\`\`${moment.unix(item.first_mentioned_on).format("YYYY-MM-DD")}\`\`\` ($${item.first_mentioned_price})\n` +
        `*Current Price:* \`\`\`$${item.last_trade_price}\`\`\`\n` +
        `*Total P/L:* \`\`\`$${item.pl}\`\`\` (${item.pl_percentage}%) ${getPriceMovementIcon(item.pl)}\n`
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

exports.sendReportForWatchlistByPerformanceGroupBySectorToGroups = async (bot, groupId) => {
  const promises = [];

  try {
    const group = await this.getRegisteredGroupById(groupId);
    const watchlistTickersByPerformanceGroupBySector = await reporter.getWatchlistTickersByPerformanceGroupBySector(group.id);
    let replyMessageText = "";
    Object.keys(watchlistTickersByPerformanceGroupBySector).forEach((sector) => {
      const watchlistTickersByPerformance = watchlistTickersByPerformanceGroupBySector[sector];
      const messageText = watchlistTickersByPerformance.slice(0, 1).map((item, index) => {
        return `*Ticker:* [${item.symbol}](https://robinhood.com/stocks/${item.symbol}) ${item.country_flag} (\`\`\`$${item.last_trade_price}\`\`\`)`;
      });
      if (messageText.length > 0) {
        replyMessageText += `\n\n*Sector:* ${sector}\n` + messageText.join("\n");
      }
    });
    if (replyMessageText) {
      const groupName = group.type == "group" ? group.title : group.first_name;
      const headerText = `*Watchlist Status:* ${groupName}\nTop 10 performaning stocks from watchlist per sector:`;
      promises.push(bot.telegram.sendMessage(group.id, headerText + replyMessageText, { parse_mode: "Markdown", disable_web_page_preview: true }));
    } else {
      promises.push(bot.telegram.sendMessage(groupId, "Watchlist is empty!", { parse_mode: "Markdown" }));
    }
  } catch (err) {
    await bot.telegram.sendMessage(groupId, "Group is not registered to receive response.\nPlease register using /register", {
      parse_mode: "Markdown",
    });
  }

  await Promise.all(promises);
};

exports.sendReportForTopMentionedByPerformanceToGroups = async (bot, overrideGroupId) => {
  const promises = [];
  const groups = await this.getRegisteredGroups();
  groups.forEach(async (group) => promises.push(_sendReportForTopMentionedByPerformanceToGroups(bot, group, overrideGroupId)));
  await Promise.all(promises);
};

const _sendReportForTopMentionedByPerformanceToGroups = async (bot, group, overrideGroupId) => {
  const period = timeUtil.currentWeekDays("America/Los_Angeles");
  const periodStart = moment.unix(period[0]).tz("America/Los_Angeles").format("YYYY-MM-DD");
  const periodEnd = moment
    .unix(period[period.length - 1])
    .tz("America/Los_Angeles")
    .format("YYYY-MM-DD z");
  const topMentionedTickersByPerformance = await reporter.getTopMentionedTickersByPerformance(group.id, period);
  const messageText = topMentionedTickersByPerformance.slice(0, 10).map((item) => item.getFirstMentionedQuoteMessage());
  const groupName = group.type == "group" ? group.title : group.first_name;
  const headerText = `*Weekly Report:* ${groupName}\n` + `*Period:* ${periodStart} - ${periodEnd}\n` + "Top 10 stocks by performance this week:\n\n";
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
  const period = timeUtil.currentWeekDays("America/Los_Angeles");
  const periodStart = moment.unix(period[0]).tz("America/Los_Angeles").format("YYYY-MM-DD");
  const periodEnd = moment
    .unix(period[period.length - 1])
    .tz("America/Los_Angeles")
    .format("YYYY-MM-DD z");
  const topMentionedTickerByCount = await reporter.getTopMentionedTickersByCount(group.id, period);
  const messageText = Object.keys(topMentionedTickerByCount)
    .slice(0, 10)
    .map((symbol, index) => {
      const count = topMentionedTickerByCount[symbol];
      return `${count} - [${symbol}](https://robinhood.com/stocks/${symbol})`;
    });
  const groupName = group.type == "group" ? group.title : group.first_name;
  const headerText =
    `*Weekly Report:* ${groupName}\n` + `*Period:* ${periodStart} - ${periodEnd}\n` + "Top 10 stocks being talked about in this week:\n\n";
  return await bot.telegram.sendMessage(overrideGroupId || group.id, headerText + messageText.join("\n"), {
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  });
};
