"use strict";

const functions = require("firebase-functions");
const { Telegraf } = require("telegraf");
let config = functions.config();
const commandBot = require("./helper/bot/command");
const onBot = require("./helper/bot/on");
const onAction = require("./helper/bot/action");
// const onHear = require("./helper/bot/hear");
const orchestrator = require("./orchestrator");
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

// Registering commands
commandBot.register(bot);

// Registering On
onBot.register(bot);

// Registering Actions
onAction.register(bot);

// onHear.register(bot);

// error handling
bot.catch((err, ctx) => {
  functions.logger.error("[Bot] Error", err);
  return ctx.reply(`Ooops, encountered an error for ${ctx.updateType}`, err);
});

// bot.launch();

// // Enable graceful stop
// process.once("SIGINT", () => bot.stop("SIGINT"));
// process.once("SIGTERM", () => bot.stop("SIGTERM"));

// Telegram Webhook Endpoint
exports.index = functions.https.onRequest(async (request, response) => {
  functions.logger.log("Incoming message", request.body);
  return await bot.handleUpdate(request.body, response);
  // response.send("Responding to Telegram Webhook");
});

/** **********************************  Debug Endpoint  ********************************** **/
// exports.debug = functions.https.onRequest(async (request, response) => {
//   await orchestrator.expireMessages(bot);
//   response.send("Debugging api: " + expiringTime("America/Los_Angeles"));
// });

/** **********************************  Every Hour  ********************************** **/
// GCP Scheduler: Run everyday at 0000 hours IST
exports.everyHour = functions.pubsub
  .schedule("0 * * * *")
  .timeZone("America/Los_Angeles")
  .onRun(async (context) => {
    functions.logger.info("Scheduled event trigerred every hour PST");

    // Expiring messages from yesterday
    orchestrator.expireMessages(bot);
  });

/** **********************************  Holiday Events Schedulers  ********************************** **/

// GCP Scheduler: Run everyday at 0000 hours IST
exports.midnightISTScheduledFunction = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    functions.logger.info("Scheduled event trigerred 0000 IST");
    orchestrator.indiaHoliday(bot, config);
  });

// GCP Scheduler: Run everyday at 0000 hours PST
exports.midnighPSTScheduledFunction = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("America/Los_Angeles")
  .onRun(async (context) => {
    functions.logger.info("Scheduled event trigerred 0000 PST");
    // USA Holidays
    orchestrator.usaHoliday(bot, config);
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
