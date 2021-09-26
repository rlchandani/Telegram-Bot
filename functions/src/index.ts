/* eslint-disable no-case-declarations */
import _ from "lodash";
import moment from "moment-timezone";
import { RobinhoodWrapper } from "./helper/robinhood_wrapper";
import { logger, runWith, database, pubsub } from "firebase-functions";
import { firebaseConfig } from "./helper/firebase_config";
import { Telegraf, Context } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { initTelegraf } from "./helper/bot";
import {
  getAllGroups,
  sendMessageToRegisteredGroups,
  sendPollToRegisteredGroups,
  expireMessages,
  indiaHoliday,
  usaHoliday,
  getMentionedTickerByDayForGroup,
  addMentionedTickerNormalizedDaily,
  addMentionedTickerNormalizedWeekly
} from "./orchestrators";
import { is9AM, is4PM } from "./helper/timeUtil";
import { isMarketOpenToday } from "./helper/utils";
import { MessageType } from "./model/messageType.model";
import { MentionedTickerRecord } from "./model/dao";
import { generateHydrationValues } from "./api/helpers/hydration.helpers";

/** **********************************  Telegram Init  ********************************** **/
// Configure Telegraf bot using access token
const bot: Telegraf<Context<Update>> = initTelegraf();

// Telegram Webhook Endpoint
exports.index = runWith({
  timeoutSeconds: 30,
  memory: "512MB"
}).https.onRequest(async (request, response) => {
  logger.log("Incoming message", request.body);
  return await bot.handleUpdate(request.body, response);
  // response.send("Responding to Telegram Webhook");
});

/** **********************************  Debug Endpoint  ********************************** **/
exports.debug = runWith({
  timeoutSeconds: 10,
  memory: "1GB"
}).https.onRequest(async (request, response) => {
  // orchestrator.sendReportForTopMentionedByCountToGroups(bot);
  // orchestrator.sendReportForTopMentionedByPerformanceToGroups(bot);
  let msg = "No action provided";
  const query = request.query;
  if (query !== undefined) {
    switch (query.action) {
      case "scheduledPolls":
        await sendPollToRegisteredGroups(
          bot,
          "Debug Poll?",
          [
            "Super Bullish (+ve) 🚀🚀",
            "Bullish (+ve) 🚀",
            "Bearish (-ve) 💩",
            "Full barbaad ho gaya 💩😫"
          ],
          MessageType.MORNING_POLL,
          { is_anonymous: false }
        );
        msg =
            "Poll sent, will be delivered if group is registered to scheduled poll service";
        break;
      case "scheduledReminders":
        await sendMessageToRegisteredGroups(
          bot,
          "scheduled_reminders",
          `⏰ *Reminder* to share your top 5 movers for today *${moment().format("YYYY-MM-DD")}* in terms of 💵 value.`,
          MessageType.DAILY_PERFORMER,
          {
            parse_mode: "Markdown",
            reply_markup: { force_reply: true }
          }
        );
        msg =
            "Reminder Sent, will be delivered if group is registered to scheduled reminder service";
        break;
      case "expireMessages":
        await expireMessages(bot, 3);
        msg = "Messages expired";
        break;
      case "holidayEventsIndia":
        msg =
            "Holiday Events (India) Sent, will be delivered if group is registered to holidaty events (India) service";
        await indiaHoliday(bot);
        break;
      case "holidayEventsUSA":
        msg =
            "Holiday Events (USA) Sent, will be delivered if group is registered to holidaty events (USA) service";
        await usaHoliday(bot);
        break;
      case "backfillMentionedTickerNormalizedTable":
        msg = "Backfilling MentionedTickerNormalized Table";
        const days = [];
        const todayStartOfDay = moment()
          .tz("America/Los_Angeles")
          .startOf("day");
        for (let i = 0; i <= 1000; i++) {
          const day = moment(todayStartOfDay).subtract(i, "days");
          if (day.isBefore()) {
            days.push(day.unix());
          }
        }
        days.reverse();
        logger.log(JSON.stringify(days));
        const groups = await getAllGroups();
        logger.log(groups);
        for (let i = 0; i < groups.length; i++) {
          const group = groups[i];
          for (let j = 0; j < days.length; j++) {
            logger.log(`Processing: ${days[j]}`);
            const mentionedTickers: MentionedTickerRecord = await getMentionedTickerByDayForGroup(group.id, days[j]);
            for (const [key, value] of _.entries(mentionedTickers)) {
              logger.log(`Processing: ${key}: ${JSON.stringify(value)}`);
              // TODO: Need to uncomment this
              await addMentionedTickerNormalizedDaily(group.id, value.userId, value.symbol, value.price, value.day, value.createdOn);
              await addMentionedTickerNormalizedWeekly(group.id, value.userId, value.symbol, value.price, value.day, value.createdOn);
            }
          }
        }
        break;
      case "hyderateValues":
        await generateHydrationValues(["TSLA", "BMG"]).then((result) => {
          result.forEach((entry) => {
            logger.log(entry);
          });
        });
        break;
      default:
        msg = "Action not defined";
    }
  }
  response.send(`Debugging API - ${msg}`);
});

/** **********************************  Database Trigger  ********************************** **/
// Copy data from mentionedTicker table to mentionedTickerNormalzied table
exports.mentionedTickerOnCreateTrigger = database
  .ref("/mentionedTicker/{groupId}/{id}/")
  .onCreate((snapshot, context) => {
    // Grab the current value of what was written to the Realtime Database.
    const original = snapshot.val();
    addMentionedTickerNormalizedDaily(
      context.params.groupId,
      original.userId,
      original.symbol,
      original.price,
      original.day,
      original.createdOn
    );
    addMentionedTickerNormalizedWeekly(
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
exports.everyHour = pubsub
  .schedule("0 * * * *")
  .timeZone("America/Los_Angeles")
  .onRun(async (context) => {
    logger.info("Scheduled event trigerred every hour PST");
    // Expiring messages from yesterday
    expireMessages(bot);
  });

/** **********************************  Holiday Events Schedulers  ********************************** **/

// GCP Scheduler: Run everyday at 0000 hours IST
exports.midnightISTScheduledFunction = pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    logger.info("Scheduled event trigerred 0000 IST");
    // India Holidays
    indiaHoliday(bot);
  });

// GCP Scheduler: Run everyday at 0000 hours PST
exports.midnighPSTScheduledFunction = pubsub
  .schedule("0 0 * * *")
  .timeZone("America/Los_Angeles")
  .onRun(async (context) => {
    logger.info("Scheduled event trigerred 0000 PST");
    // USA Holidays
    usaHoliday(bot);
  });

/** *******************************  Portfolio Poll Events Schedulers  ****************************** **/

// GCP Scheduler: Runs on weekday at 0900, 1600 and 1800 hours
exports.stockMovementPollScheduledFunction = pubsub
  .schedule("0 9,16,18 * * 1-5")
  .onRun(async (context) => {
    logger.info("Scheduled poll trigerred @9AM/4PM/6PM");
    const RobinhoodWrapperClient = new RobinhoodWrapper(
      firebaseConfig.robinhood.username,
      firebaseConfig.robinhood.password,
      firebaseConfig.robinhood.api_key
    );
    if (await isMarketOpenToday(RobinhoodWrapperClient)) {
      logger.info("Market is open today");
      if (is9AM("America/Los_Angeles")) {
        logger.info("Sending 9AM poll");
        await sendPollToRegisteredGroups(
          bot,
          "Portfolio Movement @9AM?",
          [
            "Super Bullish (+ve) 🚀🚀",
            "Bullish (+ve) 🚀",
            "Bearish (-ve) 💩",
            "Full barbaad ho gaya 💩😫"
          ],
          MessageType.MORNING_POLL,
          { is_anonymous: false }
        );
      }
      if (is4PM("America/Los_Angeles")) {
        logger.info("Sending 4PM poll");
        await sendPollToRegisteredGroups(
          bot,
          "Portfolio Movement @4PM?",
          [
            "Super Bullish (+ve) 🚀🚀",
            "Bullish (+ve) 🚀",
            "Bearish (-ve) 💩",
            "Full barbaad ho gaya 💩😫"
          ],
          MessageType.EVENING_POLL,
          { is_anonymous: false }
        );
      }
      if (is4PM("America/Los_Angeles")) {
        logger.info("Sending 4PM reminder message");
        await sendMessageToRegisteredGroups(
          bot,
          "scheduled_reminders",
          `⏰ *Reminder* to share your top 5 movers for today *${moment().format("YYYY-MM-DD")}* in terms of 💵 value.`,
          MessageType.DAILY_PERFORMER,
          {
            parse_mode: "Markdown",
            reply_markup: { force_reply: true }
          }
        );
      }
    } else {
      logger.info("Market is closed today");
    }
  });
