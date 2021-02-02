"use strict";

const functions = require("firebase-functions");
const { Telegraf } = require("telegraf");
let config = functions.config();
const commandBot = require("./helper/bot/command");
const onBot = require("./helper/bot/on");
const onAction = require("./helper/bot/action");
// const onHear = require("./helper/bot/hear");
const orchestrator = require("./orchestrator");
const calendar = require("./helper/google/calendar");
const { create } = require("./helper/robinhood/session");
const { marketIsOpenToday } = require("./helper/robinhood/market");
const { is9AM, is4PM } = require("./helper/utils");

// Check if not dev
if (process.env.FUNCTIONS_EMULATOR) {
  config = JSON.parse(process.env.DEBUG_TELEGRAM_CONFIG);
}

// Check if bot_token is defined
if (config.telegram.bot_token === undefined) {
  throw new TypeError("Telegram bot token must be provided!");
}

// Check if api_key is defined
if (config.google.api_key === undefined) {
  throw new TypeError("Google API key must be provided!");
}

// Check if robinhood credentials is defined
if (
  config.robinhood.username === undefined ||
  config.robinhood.password === undefined ||
  config.robinhood.api_key === undefined
) {
  throw new TypeError("Robinhood credentials must be provided!");
}

/** **********************************  Telegram Init  ********************************** **/
// Configure Telegraf bot using access token
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

/** **********************************  Debug Endpoint  ********************************** **/
exports.debug = functions.https.onRequest(async (request, response) => {
  const me = await bot.telegram.getMe();
  const indiaEvents = await calendar.getTodayEventIndia(config.google.api_key);
  if (indiaEvents.length == 0) {
    functions.logger.info("No Indian events found for today");
  }
  indiaEvents.forEach((event) => {
    orchestrator.sendMessageToRegisteredGroups(
      bot,
      "To all my Indian friends,\n\nHappy " + event + "!!! 🎊🎉🥂\n\n Best Wishes\n-" + me.first_name
    );
  });

  const usaEvents = await calendar.getTodayEventUSA(config.google.api_key);
  if (usaEvents.length == 0) {
    functions.logger.info("No USA events found for today");
  }
  usaEvents.forEach((event) => {
    orchestrator.sendMessageToRegisteredGroups(
      bot,
      "To all my American friends,\n\nHappy " + event + "!!! 🎊🎉🥂\n\n Best Wishes\n-" + me.first_name
    );
  });
  response.send("Debugging api");
});

/** **********************************  Holiday Events Schedulers  ********************************** **/

// GCP Scheduler: Run everyday at 0000 hours IST
exports.indiaHolidayScheduledFunction = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    functions.logger.info("Scheduled Indian holiday wish trigerred @9AM IST");
    const me = await bot.telegram.getMe();
    const indiaEvents = await calendar.getTodayEventIndia(config.google.api_key);
    if (indiaEvents.length == 0) {
      functions.logger.info("No Indian events found for today");
    }
    indiaEvents.forEach((event) => {
      orchestrator.sendMessageToRegisteredGroups(
        bot,
        "To all my Indian friends,\n\nHappy " + event + "!!! 🎊🎉🥂\n\n Best Wishes\n-" + me.first_name
      );
    });
  });

// GCP Scheduler: Run everyday at 0000 hours PST
exports.usaHolidayScheduledFunction = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("America/Los_Angeles")
  .onRun(async (context) => {
    functions.logger.info("Scheduled USA holiday wish trigerred @9AM PST");
    const me = await bot.telegram.getMe();
    const usaEvents = await calendar.getTodayEventUSA(config.google.api_key);
    if (usaEvents.length == 0) {
      functions.logger.info("No USA events found for today");
    }
    usaEvents.forEach((event) => {
      orchestrator.sendMessageToRegisteredGroups(
        bot,
        "To all my American friends,\n\nHappy " + event + "!!! 🎊🎉🥂\n\n Best Wishes\n-" + me.first_name
      );
    });
  });

/** *******************************  Portfolio Poll Events Schedulers  ****************************** **/

// GCP Scheduler: Runs on weekday at 0900 and 1600 hours
exports.stockMovementPollScheduledFunction = functions.pubsub.schedule("0 9,16 * * 1-5").onRun(async (context) => {
  functions.logger.info("Scheduled poll trigerred @9AM/4PM");
  const Robinhood = await create(config.robinhood.username, config.robinhood.password, config.robinhood.api_key);
  if (await marketIsOpenToday(Robinhood)) {
    if (is9AM("America/Los_Angeles")) {
      orchestrator.sendPollToRegisteredGroups(
        bot,
        "Portfolio Movement @9AM?",
        ["Super Bullish (+ve) 🚀🚀", "Bullish (+ve) 🚀", "Bearish (-ve) 💩", "Full barbaad ho gaya 💩😫"],
        { is_anonymous: false }
      );
    }
    if (is4PM("America/Los_Angeles")) {
      orchestrator.sendPollToRegisteredGroups(
        bot,
        "Portfolio Movement @4PM?",
        ["Super Bullish (+ve) 🚀🚀", "Bullish (+ve) 🚀", "Bearish (-ve) 💩", "Full barbaad ho gaya 💩😫"],
        { is_anonymous: false }
      );
    }
  }
  return null;
});
