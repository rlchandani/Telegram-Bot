"use strict";

const functions = require("firebase-functions");
const { Markup } = require("telegraf");
const fetch = require("node-fetch").default;

exports.register = (bot) => {
  // UpdateTypes
  /* bot.on("callback_query", (ctx) => {
    functions.logger.info("Callback Query");
    functions.logger.info(ctx.update.message);
    ctx.answerCbQuery();
  });
  */
  bot.on("inline_query", async (ctx) => {
    functions.logger.info("Inline Query");
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
    functions.logger.info("Poll");
    functions.logger.info(ctx.poll);
  });

  bot.on("poll_answer", (ctx) => {
    functions.logger.info("Poll Answer");
    functions.logger.info(ctx.update.poll_answer);
  });

  // MessageSubType
  bot.on("text", (ctx) => {
    functions.logger.info(ctx.update.message);
    ctx.replyWithPoll("How you doing?", ["One", "Two"], { is_anonymous: false });
    // ctx.telegram.copyMessage(ctx.message.chat.id, ctx.message.chat.id, ctx.message.message_id, keyboard);
  });

  bot.on(["sticker", "photo", "video"], (ctx) => {
    functions.logger.info("Sticker/Photo/Video");
    functions.logger.info(ctx.update.message);
    ctx.reply("👍🏻");
  }); */

  bot.on(["new_chat_members"], (ctx) => {
    functions.logger.info("New Member");
    functions.logger.info(ctx.update.message);
    const newMember = ctx.update.message.new_chat_members.map((member) => member["first_name"]);
    ctx.reply(`Welcome ${newMember.join()} to ${ctx.update.message.chat.title} group!`);
  });
};
