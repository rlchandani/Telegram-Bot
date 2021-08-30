/* eslint-disable no-case-declarations */
const functions = require("firebase-functions");
const { firebaseConfig } = require("./helper/firebase_config");
const { Telegraf } = require("telegraf");
const commandBot = require("./helper/bot/command");
const onBot = require("./helper/bot/on");
const onAction = require("./helper/bot/action");
// const onHear = require("./helper/bot/hear");
const orchestrator = require("./orchestrator");
const timeUtil = require("./helper/timeUtil");
const utils = require("./helper/utils");
const moment = require("moment-timezone");
const RobinhoodWrapper = require("./helper/robinhood_wrapper");
const runtimeOpts = {
  timeoutSeconds: 30,
  memory: "512MB",
};

/** **********************************  Telegram Init  ********************************** **/
// Configure Telegraf bot using access token
const bot = new Telegraf(firebaseConfig.telegram.bot_token);
bot.use(async (ctx, next) => {
  const message = ctx.update.message;
  if (message !== undefined) {
    try {
      await orchestrator.registerUser(message.from.id, message.from, message.date);
      await orchestrator.registerGroup(message.chat.id, message.chat, message.from.id, message.date);
      functions.logger.debug(JSON.stringify(message));
    } catch (e) {
      functions.logger.error("Failed in pre-middleware processing", e);
    }
  }
  await next(); // runs next middleware
});

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
exports.index = functions.runWith(runtimeOpts).https.onRequest(async (request, response) => {
  functions.logger.log("Incoming message", request.body);
  return await bot.handleUpdate(request.body, response);
  // response.send("Responding to Telegram Webhook");
});

/** **********************************  Debug Endpoint  ********************************** **/
exports.debug = functions.runWith({ timeoutSeconds: 300, memory: "1GB" }).https.onRequest(async (request, response) => {
  // orchestrator.sendReportForTopMentionedByCountToGroups(bot);
  // orchestrator.sendReportForTopMentionedByPerformanceToGroups(bot);
  let msg = "No action provided";
  const query = request.query;
  if (query !== undefined) {
    switch (query.action) {
      case "scheduledPolls":
        await orchestrator.sendPollToRegisteredGroups(
          bot,
          "Debug Poll?",
          ["Super Bullish (+ve) 🚀🚀", "Bullish (+ve) 🚀", "Bearish (-ve) 💩", "Full barbaad ho gaya 💩😫"],
          { is_anonymous: false }
        );
        msg = "Poll sent, will be delivered if group is registered to scheduled poll service";
        break;
      case "scheduledReminders":
        await orchestrator.sendMessageToRegisteredGroups(
          bot,
          "scheduled_reminders",
          `⏰ *Reminder* to share your top 5 movers for today *${moment().format("YYYY-MM-DD")}* in terms of 💵 value.`,
          { parse_mode: "Markdown", reply_markup: { force_reply: true } }
        );
        msg = "Reminder Sent, will be delivered if group is registered to scheduled reminder service";
        break;
      case "expireMessages":
        await orchestrator.expireMessages(bot, 3);
        msg = "Messages expired";
        break;
      case "holidayEventsIndia":
        msg = "Holiday Events (India) Sent, will be delivered if group is registered to holidaty events (India) service";
        await orchestrator.indiaHoliday(bot);
        break;
      case "holidayEventsUSA":
        msg = "Holiday Events (USA) Sent, will be delivered if group is registered to holidaty events (USA) service";
        await orchestrator.usaHoliday(bot);
        break;
      case "backfillMentionedTickerNormalizedTable":
        msg = "Backfilling MentionedTickerNormalized Table";
        const days = [];
        const todayStartOfDay = moment().tz("America/Los_Angeles").startOf("day");
        for (let i = 0; i <= 1000; i++) {
          const day = moment(todayStartOfDay).subtract(i, "days");
          if (day.isBefore()) {
            days.push(day.unix());
          }
        }
        days.reverse();
        functions.logger.log(JSON.stringify(days));
        const groups = await orchestrator.getRegisteredGroups();
        functions.logger.log(groups);
        for (let i = 0; i < groups.length; i++) {
          const group = groups[i];
          for (let j = 0; j < days.length; j++) {
            functions.logger.log(`Processing: ${days[j]}`);
            const mentionedTickers = await orchestrator.getMentionedTickerByDayForGroup(group.id, days[j]);
            for (const [key, value] of Object.entries(mentionedTickers)) {
              functions.logger.log(`Processing: ${key}: ${JSON.stringify(value)}`);
              await orchestrator.registerMentionedTickerNormalized(group.id, value.userId, value.symbol, value.price, value.day, value.createdOn);
            }
          }
        }
        break;
      default:
        msg = "Action not defined";
    }
  }
  response.send(`Debugging API - ${msg}`);
});

/** **********************************  Database Trigger  ********************************** **/
// Copy data from mentionedTicker table to mentionedTickerNormalzied table
exports.mentionedTickerOnCreateTrigger = functions.database.ref("/mentionedTicker/{groupId}/{id}/").onCreate((snapshot, context) => {
  // Grab the current value of what was written to the Realtime Database.
  const original = snapshot.val();
  return orchestrator.registerMentionedTickerNormalized(
    context.params.groupId,
    original.userId,
    original.symbol,
    original.price,
    original.day,
    original.createdOn
  );
});

/** **********************************  Every Hour  ********************************** **/
// GCP Scheduler: Run everyday at 0000 hours PST
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
    orchestrator.indiaHoliday(bot);
  });

// GCP Scheduler: Run everyday at 0000 hours PST
exports.midnighPSTScheduledFunction = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("America/Los_Angeles")
  .onRun(async (context) => {
    functions.logger.info("Scheduled event trigerred 0000 PST");
    // USA Holidays
    orchestrator.usaHoliday(bot);
  });

/** *******************************  Portfolio Poll Events Schedulers  ****************************** **/

// GCP Scheduler: Runs on weekday at 0900, 1600 and 1800 hours
exports.stockMovementPollScheduledFunction = functions.pubsub.schedule("0 9,16,18 * * 1-5").onRun(async (context) => {
  functions.logger.info("Scheduled poll trigerred @9AM/4PM/6PM");
  const RobinhoodWrapperClient = new RobinhoodWrapper(
    firebaseConfig.robinhood.username,
    firebaseConfig.robinhood.password,
    firebaseConfig.robinhood.api_key
  );
  if (await utils.isMarketOpenToday(RobinhoodWrapperClient)) {
    functions.logger.info("Market is open today");
    if (timeUtil.is9AM("America/Los_Angeles")) {
      functions.logger.info("Sending 9AM poll");
      await orchestrator.sendPollToRegisteredGroups(
        bot,
        "Portfolio Movement @9AM?",
        ["Super Bullish (+ve) 🚀🚀", "Bullish (+ve) 🚀", "Bearish (-ve) 💩", "Full barbaad ho gaya 💩😫"],
        { is_anonymous: false }
      );
    }
    if (timeUtil.is4PM("America/Los_Angeles")) {
      functions.logger.info("Sending 4PM poll");
      await orchestrator.sendPollToRegisteredGroups(
        bot,
        "Portfolio Movement @4PM?",
        ["Super Bullish (+ve) 🚀🚀", "Bullish (+ve) 🚀", "Bearish (-ve) 💩", "Full barbaad ho gaya 💩😫"],
        { is_anonymous: false }
      );
    }
    if (timeUtil.is4PM("America/Los_Angeles")) {
      functions.logger.info("Sending 4PM reminder message");
      await orchestrator.sendMessageToRegisteredGroups(
        bot,
        "scheduled_reminders",
        `⏰ *Reminder* to share your top 5 movers for today *${moment().format("YYYY-MM-DD")}* in terms of 💵 value.`,
        { parse_mode: "Markdown", reply_markup: { force_reply: true } }
      );
    }
  } else {
    functions.logger.info("Market is closed today");
  }
});
