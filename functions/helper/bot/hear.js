"use strict";

const functions = require("firebase-functions");

exports.register = (bot) => {
  bot.hears("hi", (ctx) => {
    functions.logger.info("Telegram Event: Hear Hi");
    ctx.reply(`Hello ${ctx.update.message.from.first_name}`);
  });
};
