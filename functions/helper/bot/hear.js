"use strict";

const functions = require("firebase-functions");

exports.register = (bot) => {
  bot.hears("hi", async (ctx) => {
    functions.logger.info("Telegram Event: Hear Hi");
    await ctx.reply(`Hello ${ctx.update.message.from.first_name}`);
  });
};
