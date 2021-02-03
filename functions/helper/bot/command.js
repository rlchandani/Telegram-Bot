"use strict";

const functions = require("firebase-functions");
const {
  commandQuote,
  commandRegister,
  commandDeRegister,
  commandCreatePoll,
  commandListPoll,
} = require("./bot_orchestration");

/* const { Markup } = require("telegraf");

const keyboard = Markup.inlineKeyboard([
  Markup.button.url("❤️", "http://telegraf.js.org"),
  Markup.button.callback("Delete", "delete"),
]); */

exports.register = (bot) => {
  bot.start((ctx) => {
    functions.logger.info("Start");
    ctx.reply(
      `Welcome ${ctx.update.message.from.first_name},\n\n` +
        "You are now connected to Masala Bot.\n\n" +
        "Use /help to get the list of supported commands."
    );
  });

  bot.help(async (ctx) => {
    functions.logger.info("Help");
    const commands = await ctx.getMyCommands();
    const info = commands.reduce((acc, val) => `${acc}/${val.command} - ${val.description}\n`, "");
    return ctx.reply("You can control me by sending these commands:\n\n" + info);
  });

  bot.settings(async (ctx) => {
    await ctx.setMyCommands([
      {
        command: "/about",
        description: "Get information about this bot and his developer",
      },
      {
        command: "/help",
        description: "Find help",
      },
      {
        command: "/start",
        description: "Start the interaction with this bot",
      },
      {
        command: "/register",
        description: "Register this group to get timely messages",
      },
      {
        command: "/deregister",
        description: "Deregister this group from getting timely messages",
      },
      /* {
        command: "/createpoll",
        description: "Create a new poll",
      },
      {
        command: "/listpoll",
        description: "Show list of available polls",
      }, */
      {
        command: "/quote",
        description: "Get stock quote. Eg: Need ticker symbol as parameter",
      },
    ]);
    return ctx.reply("Bot configured");
  });

  /* bot.command("quit", (ctx) => {
    functions.logger.info("Quit");
    ctx.reply("Thank you for using Masala Bot. \nQuitting the group on your request.");
    ctx.leaveChat();
  }); */

  bot.command("about", (ctx) => {
    functions.logger.info("About");
    ctx.reply("Made with ❤️, developed by Rohit Lal Chandani");
  });

  bot.command("quote", async (ctx) => {
    functions.logger.info("Quote");
    commandQuote(ctx);
  });

  bot.command("register", async (ctx) => {
    functions.logger.info("Register");
    commandRegister(ctx);
  });

  bot.command("deregister", async (ctx) => {
    functions.logger.info("Exit");
    commandDeRegister(ctx);
  });

  bot.command("createpoll", async (ctx) => {
    functions.logger.info("Create Poll");
    commandCreatePoll(ctx);
  });

  bot.command("listpoll", async (ctx) => {
    functions.logger.info("List Poll");
    commandListPoll(ctx);
  });
};
