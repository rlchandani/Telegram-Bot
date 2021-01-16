"use strict";

const functions = require("firebase-functions");

exports.register = (bot) => {
  bot.action("delete", (ctx) => {
    functions.logger.info("Delete");
    ctx.deleteMessage();
  });
};
