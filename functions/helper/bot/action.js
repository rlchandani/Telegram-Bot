"use strict";

const functions = require("firebase-functions");
const orchestrator = require("../../orchestrator");
const registerAction = require("../../model/register_action");
const { Markup } = require("telegraf");

exports.register = (bot) => {
  bot.action("delete", (ctx) => {
    functions.logger.info("Telegram Event: Action Delete");
    ctx.deleteMessage();
  });

  /** *********************** Scheduled Polls ************************ */

  bot.action("scheduled_polls", async (ctx) => {
    functions.logger.info("Telegram Event: Action Scheduled Polls");
    const responseKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Enable", "scheduled_polls_enable"),
      Markup.button.callback("Disable", "scheduled_polls_disable"),
    ]);
    await ctx.editMessageText("Action for Scheduled Polls Service:", responseKeyboard);
  });

  bot.action("scheduled_polls_enable", async (ctx) => {
    functions.logger.info("Telegram Event: Action Scheduled Polls Enable");
    const message = ctx.update.callback_query.message;
    await orchestrator.enableService(message.chat.id, "scheduled_polls");
    await ctx.editMessageText("Scheduled Polls Service - Enabled");
  });

  bot.action("scheduled_polls_disable", async (ctx) => {
    functions.logger.info("Telegram Event: Action Scheduled Polls Disable");
    const message = ctx.update.callback_query.message;
    await orchestrator.disableService(message.chat.id, "scheduled_polls");
    await ctx.editMessageText("Scheduled Polls Service - Disabled");
  });

  /** *********************** Scheduled Reminder ************************ */

  bot.action("scheduled_reminders", async (ctx) => {
    functions.logger.info("Telegram Event: Action Scheduled Reminders");
    const responseKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Enable", "scheduled_reminders_enable"),
      Markup.button.callback("Disable", "scheduled_reminders_disable"),
    ]);
    await ctx.editMessageText("Action for Scheduled Reminders Service:", responseKeyboard);
  });

  bot.action("scheduled_reminders_enable", async (ctx) => {
    functions.logger.info("Telegram Event: Action Scheduled Reminders Enable");
    const message = ctx.update.callback_query.message;
    await orchestrator.enableService(message.chat.id, "scheduled_reminders");
    await ctx.editMessageText("Scheduled Reminders Service - Enabled");
  });

  bot.action("scheduled_reminders_disable", async (ctx) => {
    functions.logger.info("Telegram Event: Action Scheduled Reminders Disable");
    const message = ctx.update.callback_query.message;
    await orchestrator.disableService(message.chat.id, "scheduled_reminders");
    await ctx.editMessageText("Scheduled Reminders Service - Disabled");
  });

  /** *********************** Automated Quotes ************************ */

  bot.action("automated_quotes", async (ctx) => {
    functions.logger.info("Telegram Event: Action Automated Quotes");
    const responseKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Enable", "automated_quotes_enable"),
      Markup.button.callback("Disable", "automated_quotes_disable"),
    ]);
    await ctx.editMessageText("Actiont for Automated Quotes Service:", responseKeyboard);
  });

  bot.action("automated_quotes_enable", async (ctx) => {
    functions.logger.info("Telegram Event: Action Automated Quotes Enable");
    const message = ctx.update.callback_query.message;
    await orchestrator.enableService(message.chat.id, "automated_quotes");
    await ctx.editMessageText("Automated Quotes Service - Enabled");
  });

  bot.action("automated_quotes_disable", async (ctx) => {
    functions.logger.info("Telegram Event: Action Automated Quotes Disable");
    const message = ctx.update.callback_query.message;
    await orchestrator.disableService(message.chat.id, "automated_quotes");
    await ctx.editMessageText("Automated Quotes Service - Disabled");
  });

  /** *********************** Welcome New Member(s) ************************ */

  bot.action("automated_welcome_members", async (ctx) => {
    functions.logger.info("Telegram Event: Action Welcome New Member");
    const responseKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Enable", "automated_welcome_members_enable"),
      Markup.button.callback("Disable", "automated_welcome_members_disable"),
    ]);
    await ctx.editMessageText("Action for Welcome New Member Service:", responseKeyboard);
  });

  bot.action("automated_welcome_members_enable", async (ctx) => {
    functions.logger.info("Telegram Event: Action Welcome New Member Enable");
    const message = ctx.update.callback_query.message;
    await orchestrator.enableService(message.chat.id, "automated_welcome_members");
    await ctx.editMessageText("Welcome New Member Service - Enabled");
  });

  bot.action("automated_welcome_members_disable", async (ctx) => {
    functions.logger.info("Telegram Event: Action Welcome New Member Disable");
    const message = ctx.update.callback_query.message;
    await orchestrator.disableService(message.chat.id, "automated_welcome_members");
    await ctx.editMessageText("Welcome New Member Service - Disabled");
  });

  /** *********************** Holiday Event India ************************ */

  bot.action("holiday_events_india", async (ctx) => {
    functions.logger.info("Telegram Event: Action Holiday Events India");
    const responseKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Enable", "holiday_events_india_enable"),
      Markup.button.callback("Disable", "holiday_events_india_disable"),
    ]);
    await ctx.editMessageText("Action for Holiday Events (India) Service:", responseKeyboard);
  });

  bot.action("holiday_events_india_enable", async (ctx) => {
    functions.logger.info("Telegram Event: Action Holiday Events India Enable");
    const message = ctx.update.callback_query.message;
    await orchestrator.enableService(message.chat.id, "holiday_events_india");
    await ctx.editMessageText("Holiday Events (India) Service - Enabled");
  });

  bot.action("holiday_events_india_disable", async (ctx) => {
    functions.logger.info("Telegram Event: Action Holiday Events India Disable");
    const message = ctx.update.callback_query.message;
    await orchestrator.disableService(message.chat.id, "holiday_events_india");
    await ctx.editMessageText("Holiday Events (India) Service - Disabled");
  });

  /** *********************** Holiday Event USA ************************ */

  bot.action("holiday_events_usa", async (ctx) => {
    functions.logger.info("Telegram Event: Action Holiday Events USA");
    const responseKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Enable", "holiday_events_usa_enable"),
      Markup.button.callback("Disable", "holiday_events_usa_disable"),
    ]);
    await ctx.editMessageText("Action for Holiday Events (USA) Service:", responseKeyboard);
  });

  bot.action("holiday_events_usa_enable", async (ctx) => {
    functions.logger.info("Telegram Event: Action Holiday Events USA Enable");
    const message = ctx.update.callback_query.message;
    await orchestrator.enableService(message.chat.id, "holiday_events_usa");
    await ctx.editMessageText("Holiday Events (USA) Service - Enabled");
  });

  bot.action("holiday_events_usa_disable", async (ctx) => {
    functions.logger.info("Telegram Event: Action Holiday Events USA Disable");
    const message = ctx.update.callback_query.message;
    await orchestrator.disableService(message.chat.id, "holiday_events_usa");
    await ctx.editMessageText("Holiday Events (USA) Service - Disabled");
  });

  /** *********************** All Services ************************ */

  bot.action("all_services", async (ctx) => {
    functions.logger.info("Telegram Event: Action All Services");
    const responseKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Enable", "all_services_enable"),
      Markup.button.callback("Disable", "all_services_disable"),
    ]);
    await ctx.editMessageText("Action for All Services:", responseKeyboard);
  });

  bot.action("all_services_enable", async (ctx) => {
    functions.logger.info("Telegram Event: Action All Services Enable");
    const message = ctx.update.callback_query.message;
    const promises = [];
    registerAction.registerOptions.forEach((optionGroup) =>
      optionGroup.forEach((option) => {
        promises.push(orchestrator.enableService(message.chat.id, option.action));
      })
    );
    await Promise.all(promises);
    await ctx.editMessageText("All Services - Enabled");
  });

  bot.action("all_services_disable", async (ctx) => {
    functions.logger.info("Telegram Event: Action All Services Disable");
    const message = ctx.update.callback_query.message;
    const promises = [];
    registerAction.registerOptions.forEach((optionGroup) =>
      optionGroup.forEach((option) => {
        promises.push(orchestrator.disableService(message.chat.id, option.action));
      })
    );
    await Promise.all(promises);
    await ctx.editMessageText("All Services - Disabled");
  });
};
