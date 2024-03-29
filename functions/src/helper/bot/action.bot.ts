import { logger } from "firebase-functions";
import { enableServiceForGroup, disableServiceForGroup } from "../../orchestrators";
import { registerOptions } from "../../model/registerAction.model";
import { Markup } from "telegraf";

export const botRegisterAction = (bot: any) => {
  bot.action("delete", (ctx: any) => {
    logger.info("Telegram Event: Action Delete");
    ctx.deleteMessage();
  });

  /** *********************** Scheduled Polls ************************ */

  bot.action("scheduled_polls", async (ctx: any) => {
    logger.info("Telegram Event: Action Scheduled Polls");
    const responseKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Enable", "scheduled_polls_enable"),
      Markup.button.callback("Disable", "scheduled_polls_disable")
    ]);
    await ctx.editMessageText("Action for Scheduled Polls Service:", responseKeyboard);
  });

  bot.action("scheduled_polls_enable", async (ctx: any) => {
    logger.info("Telegram Event: Action Scheduled Polls Enable");
    const callbackQuery = ctx.update.callback_query;
    const message = callbackQuery.message;
    const requesterId = callbackQuery.from.id;
    const requesterName = callbackQuery.from.first_name;
    await enableServiceForGroup(message.chat.id, "scheduled_polls");
    await ctx.editMessageText(
      `✅ Scheduled Polls Service - Enabled\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  });

  bot.action("scheduled_polls_disable", async (ctx: any) => {
    logger.info("Telegram Event: Action Scheduled Polls Disable");
    const callbackQuery = ctx.update.callback_query;
    const message = callbackQuery.message;
    const requesterId = callbackQuery.from.id;
    const requesterName = callbackQuery.from.first_name;
    await disableServiceForGroup(message.chat.id, "scheduled_polls");
    await ctx.editMessageText(
      `✅ Scheduled Polls Service - Disabled\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  });

  /** *********************** Scheduled Reminder ************************ */

  bot.action("scheduled_reminders", async (ctx: any) => {
    logger.info("Telegram Event: Action Scheduled Reminders");
    const responseKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Enable", "scheduled_reminders_enable"),
      Markup.button.callback("Disable", "scheduled_reminders_disable")
    ]);
    await ctx.editMessageText("Action for Scheduled Reminders Service:", responseKeyboard);
  });

  bot.action("scheduled_reminders_enable", async (ctx: any) => {
    logger.info("Telegram Event: Action Scheduled Reminders Enable");
    const callbackQuery = ctx.update.callback_query;
    const message = callbackQuery.message;
    const requesterId = callbackQuery.from.id;
    const requesterName = callbackQuery.from.first_name;
    await enableServiceForGroup(message.chat.id, "scheduled_reminders");
    await ctx.editMessageText(
      `✅ Scheduled Reminders Service - Enabled\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  });

  bot.action("scheduled_reminders_disable", async (ctx: any) => {
    logger.info("Telegram Event: Action Scheduled Reminders Disable");
    const callbackQuery = ctx.update.callback_query;
    const message = callbackQuery.message;
    const requesterId = callbackQuery.from.id;
    const requesterName = callbackQuery.from.first_name;
    await disableServiceForGroup(message.chat.id, "scheduled_reminders");
    await ctx.editMessageText(
      `✅ Scheduled Reminders Service - Disabled\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  });

  /** *********************** Automated Quotes ************************ */

  bot.action("automated_quotes", async (ctx: any) => {
    logger.info("Telegram Event: Action Automated Quotes");
    const responseKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Enable", "automated_quotes_enable"),
      Markup.button.callback("Disable", "automated_quotes_disable")
    ]);
    await ctx.editMessageText("Actiont for Automated Quotes Service:", responseKeyboard);
  });

  bot.action("automated_quotes_enable", async (ctx: any) => {
    logger.info("Telegram Event: Action Automated Quotes Enable");
    const callbackQuery = ctx.update.callback_query;
    const message = callbackQuery.message;
    const requesterId = callbackQuery.from.id;
    const requesterName = callbackQuery.from.first_name;
    await enableServiceForGroup(message.chat.id, "automated_quotes");
    await ctx.editMessageText(
      `✅ Automated Quotes Service - Enabled\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  });

  bot.action("automated_quotes_disable", async (ctx: any) => {
    logger.info("Telegram Event: Action Automated Quotes Disable");
    const callbackQuery = ctx.update.callback_query;
    const message = callbackQuery.message;
    const requesterId = callbackQuery.from.id;
    const requesterName = callbackQuery.from.first_name;
    await disableServiceForGroup(message.chat.id, "automated_quotes");
    await ctx.editMessageText(
      `✅ Automated Quotes Service - Disabled\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  });

  /** *********************** Welcome New Member(s) ************************ */

  bot.action("automated_welcome_members", async (ctx: any) => {
    logger.info("Telegram Event: Action Welcome New Member");
    const responseKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Enable", "automated_welcome_members_enable"),
      Markup.button.callback("Disable", "automated_welcome_members_disable")
    ]);
    await ctx.editMessageText("Action for Welcome New Member Service:", responseKeyboard);
  });

  bot.action("automated_welcome_members_enable", async (ctx: any) => {
    logger.info("Telegram Event: Action Welcome New Member Enable");
    const callbackQuery = ctx.update.callback_query;
    const message = callbackQuery.message;
    const requesterId = callbackQuery.from.id;
    const requesterName = callbackQuery.from.first_name;
    await enableServiceForGroup(message.chat.id, "automated_welcome_members");
    await ctx.editMessageText(
      `✅ Welcome New Member Service - Enabled\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  });

  bot.action("automated_welcome_members_disable", async (ctx: any) => {
    logger.info("Telegram Event: Action Welcome New Member Disable");
    const callbackQuery = ctx.update.callback_query;
    const message = callbackQuery.message;
    const requesterId = callbackQuery.from.id;
    const requesterName = callbackQuery.from.first_name;
    await disableServiceForGroup(message.chat.id, "automated_welcome_members");
    await ctx.editMessageText(
      `✅ Welcome New Member Service - Disabled\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  });

  /** *********************** Holiday Event India ************************ */

  bot.action("holiday_events_india", async (ctx: any) => {
    logger.info("Telegram Event: Action Holiday Events India");
    const responseKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Enable", "holiday_events_india_enable"),
      Markup.button.callback("Disable", "holiday_events_india_disable")
    ]);
    await ctx.editMessageText("Action for Holiday Events (India) Service:", responseKeyboard);
  });

  bot.action("holiday_events_india_enable", async (ctx: any) => {
    logger.info("Telegram Event: Action Holiday Events India Enable");
    const callbackQuery = ctx.update.callback_query;
    const message = callbackQuery.message;
    const requesterId = callbackQuery.from.id;
    const requesterName = callbackQuery.from.first_name;
    await enableServiceForGroup(message.chat.id, "holiday_events_india");
    await ctx.editMessageText(
      `✅ Holiday Events (India) Service - Enabled\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  });

  bot.action("holiday_events_india_disable", async (ctx: any) => {
    logger.info("Telegram Event: Action Holiday Events India Disable");
    const callbackQuery = ctx.update.callback_query;
    const message = callbackQuery.message;
    const requesterId = callbackQuery.from.id;
    const requesterName = callbackQuery.from.first_name;
    await disableServiceForGroup(message.chat.id, "holiday_events_india");
    await ctx.editMessageText(
      `✅ Holiday Events (India) Service - Disabled\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  });

  /** *********************** Holiday Event USA ************************ */

  bot.action("holiday_events_usa", async (ctx: any) => {
    logger.info("Telegram Event: Action Holiday Events USA");
    const responseKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Enable", "holiday_events_usa_enable"),
      Markup.button.callback("Disable", "holiday_events_usa_disable")
    ]);
    await ctx.editMessageText("Action for Holiday Events (USA) Service:", responseKeyboard);
  });

  bot.action("holiday_events_usa_enable", async (ctx: any) => {
    logger.info("Telegram Event: Action Holiday Events USA Enable");
    const callbackQuery = ctx.update.callback_query;
    const message = callbackQuery.message;
    const requesterId = callbackQuery.from.id;
    const requesterName = callbackQuery.from.first_name;
    await enableServiceForGroup(message.chat.id, "holiday_events_usa");
    await ctx.editMessageText(
      `✅ Holiday Events (USA) Service - Enabled\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  });

  bot.action("holiday_events_usa_disable", async (ctx: any) => {
    logger.info("Telegram Event: Action Holiday Events USA Disable");
    const callbackQuery = ctx.update.callback_query;
    const message = callbackQuery.message;
    const requesterId = callbackQuery.from.id;
    const requesterName = callbackQuery.from.first_name;
    await disableServiceForGroup(message.chat.id, "holiday_events_usa");
    await ctx.editMessageText(
      `✅ Holiday Events (USA) Service - Disabled\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  });

  /** *********************** Report Filtered Country Ticker ************************ */

  bot.action("report_flagged_country", async (ctx: any) => {
    logger.info("Telegram Event: Action Report Filtered Country Service");
    const responseKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Enable", "report_flagged_country_enable"),
      Markup.button.callback("Disable", "report_flagged_country_disable")
    ]);
    await ctx.editMessageText("Action for Report Filtered Country Service:", responseKeyboard);
  });

  bot.action("report_flagged_country_enable", async (ctx: any) => {
    logger.info("Telegram Event: Action Report Filtered Country Service Enable");
    const callbackQuery = ctx.update.callback_query;
    const message = callbackQuery.message;
    const requesterId = callbackQuery.from.id;
    const requesterName = callbackQuery.from.first_name;
    await enableServiceForGroup(message.chat.id, "report_flagged_country");
    await ctx.editMessageText(
      `✅ Report Filtered Country Service - Enabled\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  });

  bot.action("report_flagged_country_disable", async (ctx: any) => {
    logger.info("Telegram Event: Action Report Filtered Country Service Disable");
    const callbackQuery = ctx.update.callback_query;
    const message = callbackQuery.message;
    const requesterId = callbackQuery.from.id;
    const requesterName = callbackQuery.from.first_name;
    await disableServiceForGroup(message.chat.id, "report_flagged_country");
    await ctx.editMessageText(
      `✅ Report Filtered Country Service - Disabled\nRequested by [${requesterName}](tg://user?id=${requesterId})`,
      { parse_mode: "Markdown" }
    );
  });

  /** *********************** All Services ************************ */

  bot.action("all_services", async (ctx: any) => {
    logger.info("Telegram Event: Action All Services");
    const responseKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Enable", "all_services_enable"),
      Markup.button.callback("Disable", "all_services_disable")
    ]);
    await ctx.editMessageText("Action for All Services:", responseKeyboard);
  });

  bot.action("all_services_enable", async (ctx: any) => {
    logger.info("Telegram Event: Action All Services Enable");
    const callbackQuery = ctx.update.callback_query;
    const message = callbackQuery.message;
    const requesterId = callbackQuery.from.id;
    const requesterName = callbackQuery.from.first_name;
    const promises: any[] = [];
    registerOptions.forEach((optionGroup: any) =>
      optionGroup.forEach((option: any) => {
        promises.push(enableServiceForGroup(message.chat.id, option.action));
      }));
    await Promise.all(promises);
    await ctx.editMessageText(`✅ All Services - Enabled\nRequested by [${requesterName}](tg://user?id=${requesterId})`, { parse_mode: "Markdown" });
  });

  bot.action("all_services_disable", async (ctx: any) => {
    logger.info("Telegram Event: Action All Services Disable");
    const callbackQuery = ctx.update.callback_query;
    const message = callbackQuery.message;
    const requesterId = callbackQuery.from.id;
    const requesterName = callbackQuery.from.first_name;
    const promises: any[] = [];
    registerOptions.forEach((optionGroup: any) =>
      optionGroup.forEach((option: any) => {
        promises.push(disableServiceForGroup(message.chat.id, option.action));
      }));
    await Promise.all(promises);
    await ctx.editMessageText(`✅ All Services - Disabled\nRequested by [${requesterName}](tg://user?id=${requesterId})`, { parse_mode: "Markdown" });
  });
};
