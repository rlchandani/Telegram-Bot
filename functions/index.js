"use strict";

const functions = require("firebase-functions");
const { Telegraf } = require("telegraf");
let config = functions.config();
const commandBot = require("./helper/bot/command");
const onBot = require("./helper/bot/on");
const onAction = require("./helper/bot/action");
// const onHear = require("./helper/bot/hear");
const orchestrator = require("./orchestrator");
const Holidays = require("date-holidays");
const allowedHolidays = [
  "New Year's Day",
  "Martin Luther King Jr. Day",
  "Valentine's Day",
  "Easter Sunday",
  "Memorial Day",
  "Independence Day",
  "Labor Day",
  "Columbus Day",
  "Halloween",
  "Thanksgiving Day",
  "Christmas Eve",
  "Christmas Day",
  "New Year's Eve",
];

// Check if not dev
if (process.env.FUNCTIONS_EMULATOR) {
  config = {
    telegram: {
      bot_token: "1513291031:AAFwpv8U25A4OMn4C31YIOdz_VJrx-ubm0s",
      group_id: -431765838,
    },
  };
}

// Check if bot_token is defined
if (config.telegram.bot_token === undefined) {
  throw new TypeError("Telegram bot token must be provided!");
}

// configure Telegraf bot using access token
const bot = new Telegraf(config.telegram.bot_token);
commandBot.register(bot);
// onHear.register(bot);
onBot.register(bot);
onAction.register(bot);
bot.catch((err, ctx) => {
  functions.logger.info(`Ooops, ecountered an error for ${ctx.updateType}`, err);
});

// Telegram Webhook Endpoint
exports.index = functions.https.onRequest((request, response) => {
  functions.logger.info(request.body.message);
  bot.handleUpdate(request.body, response);
  response.send("Responding to Telegram Webhook");
});

// Debug Endpoint
exports.debug = functions.https.onRequest(async (request, response) => {
  orchestrator.sendPollToRegisteredGroups(
    bot,
    "Portfolio Movement @4PM?",
    ["Super Bullish (+ve) 🚀🚀", "Bullish (+ve) 🚀", "Bearish (-ve) 💩", "Full barbaad ho gaya 💩😫"],
    {
      is_anonymous: false,
    }
  );
  response.send("Debugging api");
});

// Current date in PST
const currentTimePST = () => {
  const currentTime = new Date();
  currentTime.setHours(currentTime.getHours() - 8);
  return currentTime;
};

// GCP Scheduler: Run everyday at 0900 hours
exports.nineAMHolidayScheduledFunction = functions.pubsub.schedule("0 9 * * *").onRun(async (context) => {
  functions.logger.info("Scheduled holiday wish trigerred @9AM");
  const me = await bot.telegram.getMe();
  const holidays = new Holidays("US", "WA");
  const todayHolidays = holidays.isHoliday(currentTimePST);
  if (typeof todayHolidays != "boolean") {
    if (Array.isArray(todayHolidays)) {
      const filteredHolidays = todayHolidays.filter((holiday) => allowedHolidays.includes(holiday.name));
      filteredHolidays.forEach((holiday) =>
        orchestrator.sendMessageToRegisteredGroups(
          bot,
          "To all my American friends,\n\nHappy " + holiday.name + "!!! 🎊🎉🥂\n\n Best Wishes\n-" + me.first_name
        )
      );
    } else {
      if (allowedHolidays.includes(todayHolidays.name)) {
        orchestrator.sendMessageToRegisteredGroups(
          bot,
          "To all my American friends,\n\nHappy " + todayHolidays.name + "!!! 🎊🎉🥂\n\n Best Wishes\n-" + me.first_name
        );
      }
    }
  }
  return null;
});

// GCP Scheduler: Runs on weekday at 0900 hours
exports.nineAMScheduledFunction = functions.pubsub.schedule("0 9 * * 1-5").onRun((context) => {
  functions.logger.info("Scheduled poll trigerred @9AM");
  orchestrator.sendMessageToRegisteredGroups(
    bot,
    "Portfolio Movement @9AM?",
    ["Super Bullish (+ve) 🚀🚀", "Bullish (+ve) 🚀", "Bearish (-ve) 💩", "Full barbaad ho gaya 💩😫"],
    { is_anonymous: false }
  );
  return null;
});

// GCP Scheduler: Runs on weekday at 1600 hours
exports.fourPMScheduledFunction = functions.pubsub.schedule("0 16 * * 1-5").onRun((context) => {
  functions.logger.info("Scheduled poll trigerred @4PM");
  orchestrator.sendMessageToRegisteredGroups(
    bot,
    "Portfolio Movement @4PM?",
    ["Super Bullish (+ve) 🚀🚀", "Bullish (+ve) 🚀", "Bearish (-ve) 💩", "Full barbaad ho gaya 💩😫"],
    { is_anonymous: false }
  );
  return null;
});
