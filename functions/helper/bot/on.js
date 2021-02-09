"use strict";

const functions = require("firebase-functions");
const { Markup } = require("telegraf");
const { onText, onEditedMessage, onNewChatMembers } = require("./bot_orchestration");
const fetch = require("node-fetch").default;

exports.register = (bot) => {
  // UpdateTypes
  /* bot.on("callback_query", (ctx) => {
    functions.logger.info("Telegram Event: On Callback Query");
    functions.logger.info(ctx.update.message);
    ctx.answerCbQuery();
  });
  */
  bot.on("inline_query", async (ctx) => {
    functions.logger.info("Telegram Event: On Inline Query");
    const apiUrl = `http://recipepuppy.com/api/?q=${ctx.inlineQuery.query}`;
    const response = await fetch(apiUrl);
    const { results } = await response.json();
    const recipes = results
      // @ts-ignore
      .filter(({ thumbnail }) => thumbnail)
      // @ts-ignore
      .map(({ title, href, thumbnail }) => ({
        type: "article",
        id: thumbnail,
        title: title,
        description: title,
        thumb_url: thumbnail,
        input_message_content: {
          message_text: title,
        },
        reply_markup: Markup.inlineKeyboard([Markup.button.url("Go to recipe", href)]),
      }));
    console.log(recipes);
    ctx.answerInlineQuery(recipes);
  });
  /*
  bot.on("poll", (ctx) => {
    functions.logger.info("Telegram Event: On Poll");
    functions.logger.info(ctx.poll);
  });

  bot.on("poll_answer", (ctx) => {
    functions.logger.info("elegram Event: On Poll Answer");
    functions.logger.info(ctx.update.poll_answer);
  });

  bot.on(["sticker", "photo", "video"], async (ctx) => {
    functions.logger.info("elegram Event: On Sticker/Photo/Video");
    functions.logger.info(ctx.update.message);
    await ctx.reply("👍🏻");
  }); */

  // MessageSubType
  bot.on("text", async (ctx) => {
    functions.logger.info("Telegram Event: On Text");
    await onText(ctx);
  });

  bot.on("edited_message", async (ctx) => {
    functions.logger.info("Telegram Event: Edited Message");
    await onEditedMessage(ctx);
  });

  bot.on(["new_chat_members"], async (ctx) => {
    functions.logger.info("Telegram Event: On New Member");
    await onNewChatMembers(ctx);
  });
};
