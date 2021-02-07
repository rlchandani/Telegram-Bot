"use strict";

const functions = require("firebase-functions");
const registeredGroupDao = require("./dao/registeredGroupDao");
const pollDao = require("./dao/pollDao");
const expiringMessageDao = require("./dao/expiringMessageDao");
const mentionedTickerDao = require("./dao/mentionedTickerDao");
const calendar = require("./helper/google/calendar");
const { expiringTime, currentWeekDays, unixToStringFormat, getPriceMovementIcon } = require("./helper/utils");
const reporter = require("./helper/reporter");
const { create } = require("./helper/robinhood/session");
const { addToWatchlist, getWatchlistByName } = require("./helper/robinhood/watchlist");

let config = functions.config();

// Check if not dev
if (process.env.FUNCTIONS_EMULATOR) {
  config = JSON.parse(process.env.DEBUG_TELEGRAM_CONFIG);
}

/** *********************** MentiondTickerDao orchestrator ************************ */

exports.registerMentionedTicker = async (groupId, userId, tickerSymbol, tickerPrice) => {
  try {
    await mentionedTickerDao.add(groupId, userId, tickerSymbol, tickerPrice);
    functions.logger.info(`Ticker registered for groupId: ${groupId} by userId: ${userId}`);
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

/** *********************** Send Message Wrapper ************************ */

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
    if (snapshot[groupId].enabled === true && messageTest) {
      bot.telegram.sendMessage(groupId, messageTest, extra);
    }
  });
};

/** *********************** Expire Message Wrapper ************************ */

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

/** *********************** Send Message on Holidays Wrapper ************************ */

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

/** *********************** Report Wrapper ************************ */

exports.sendReportForTopMentionedByPerformanceToGroups = async (bot, overrideGroupId) => {
  const promises = [];
  const headerText = "*Weekly Report:*\nPerformance of top 5 mentioned stocks this week:\n";
  const groups = await this.getRegisteredGroups();
  Object.keys(groups).forEach(async (groupId) => {
    const topMentionedTickersByPerformance = await reporter.getTopMentionedTickersByPerformance(
      groupId,
      currentWeekDays("America/Los_Angeles")
    );
    const messageText = topMentionedTickersByPerformance.map((item, index) => {
      return (
        `*Ticker:* [${item.symbol}](https://robinhood.com/stocks/${item.symbol})\n` +
        `*First Mentioned:* ${unixToStringFormat(item.day)} ($${item.first_mentioned_price})\n` +
        `*Current Price:* $${item.last_trade_price}\n` +
        `*Total P/L:* $${item.pl} (${item.pl_percentage}%) ${getPriceMovementIcon(item.pl)}\n`
      );
    });
    promises.push(
      bot.telegram.sendMessage(overrideGroupId || groupId, headerText + messageText.join("\n"), {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      })
    );
  });
  Promise.all(promises);
};

exports.sendReportForTopMentionedByCountToGroups = async (bot, overrideGroupId) => {
  const promises = [];
  const headerText = "*Weekly Report:*\nFollowing stocks are being talked about in this week:\n";
  const groups = await this.getRegisteredGroups();
  Object.keys(groups).forEach(async (groupId) => {
    const topMentionedTickerByCount = await reporter.getTopMentionedTickersByCount(
      groupId,
      currentWeekDays("America/Los_Angeles")
    );
    const messageText = Object.keys(topMentionedTickerByCount).map((symbol, index) => {
      const count = topMentionedTickerByCount[symbol];
      return `${count} - [${symbol}](https://robinhood.com/stocks/${symbol})`;
    });
    promises.push(
      bot.telegram.sendMessage(overrideGroupId || groupId, headerText + messageText.join("\n"), {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      })
    );
  });
  Promise.all(promises);
};

/** *********************** Watchlist ************************ */

exports.getWatchlistByName = async (name) => {
  const Robinhood = await create(config.robinhood.username, config.robinhood.password, config.robinhood.api_key);
  const response = await getWatchlistByName(Robinhood, name);
  console.log(response.map((item) => item.symbol));
};

exports.addToWatchlist = async (name, symbol) => {
  const Robinhood = await create(config.robinhood.username, config.robinhood.password, config.robinhood.api_key);
  await addToWatchlist(Robinhood, name, symbol);
};
