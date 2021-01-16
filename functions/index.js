"use strict";

const functions = require("firebase-functions");
const { Telegraf } = require("telegraf");
let config = functions.config();
const commandBot = require("./helper/bot/command");
const onBot = require("./helper/bot/on");
const onAction = require("./helper/bot/action");
// const onHear = require("./helper/bot/hear");
const orchestrator = require("./orchestrator");

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
    ["Bullish (+ve) 🚀", "Bearish (-ve) 💩", "Full barbaad ho gaya 😫"],
    {
      is_anonymous: false,
    }
  );
  response.send("Debugging api");
});

// GCP Scheduler: Run everyday at 0900 hours
exports.nineAMScheduledFunction = functions.pubsub.schedule("0 9 * * *").onRun((context) => {
  functions.logger.info("Scheduled poll trigerred @9AM");
  bot.telegram.sendPoll(
    config.telegram.group_id,
    "Portfolio Movement @9AM?",
    ["Bullish (+ve) 🚀", "Bearish (-ve) 💩", "Full barbaad ho gaya 😫"],
    { is_anonymous: false }
  );
  return null;
});

// GCP Scheduler: Run everyday at 1600 hours
exports.fourPMScheduledFunction = functions.pubsub.schedule("0 16 * * *").onRun((context) => {
  functions.logger.info("Scheduled poll trigerred @4PM");
  bot.telegram.sendPoll(
    config.telegram.group_id,
    "Portfolio Movement @4PM?",
    ["Bullish (+ve) 🚀", "Bearish (-ve) 💩", "Full barbaad ho gaya 😫"],
    { is_anonymous: false }
  );
  return null;
});
