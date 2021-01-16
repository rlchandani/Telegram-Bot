"use strict";

const functions = require("firebase-functions");

exports.register = (bot) => {
  bot.hears("hi", (ctx) => {
    functions.logger.info("Hear");
    ctx.reply(`Hello ${ctx.update.message.from.first_name}`);
  });
};
