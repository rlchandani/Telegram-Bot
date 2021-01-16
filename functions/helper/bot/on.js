"use strict";

const functions = require("firebase-functions");

exports.register = (bot) => {
  // UpdateTypes
  /* bot.on("callback_query", (ctx) => {
    functions.logger.info("Callback Query");
    functions.logger.info(ctx.update.message);
    ctx.answerCbQuery();
  });

  bot.on("inline_query", (ctx) => {
    functions.logger.info("Inline Query");
    functions.logger.info(ctx.update.message);
    const result = [];
    ctx.answerInlineQuery(result);
  });

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
