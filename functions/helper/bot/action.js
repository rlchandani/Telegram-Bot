"use strict";

const functions = require("firebase-functions");
const orchestrator = require("../../orchestrator");
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

  /** *********************** Scheduled Messages ************************ */

  bot.action("scheduled_messages", async (ctx) => {
    functions.logger.info("Telegram Event: Action Scheduled Messages");
    const responseKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Enable", "scheduled_messages_enable"),
      Markup.button.callback("Disable", "scheduled_messages_disable"),
    ]);
    await ctx.editMessageText("Action for Scheduled Messages Service:", responseKeyboard);
  });

  bot.action("scheduled_messages_enable", async (ctx) => {
    functions.logger.info("Telegram Event: Action Scheduled Messages Enable");
    const message = ctx.update.callback_query.message;
    await orchestrator.enableService(message.chat.id, "scheduled_messages");
    await ctx.editMessageText("Scheduled Messages Service - Enabled");
  });

  bot.action("scheduled_messages_disable", async (ctx) => {
    functions.logger.info("Telegram Event: Action Scheduled Messages Disable");
    const message = ctx.update.callback_query.message;
    await orchestrator.disableService(message.chat.id, "scheduled_messages");
    await ctx.editMessageText("Scheduled Messages Service - Disabled");
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
};
