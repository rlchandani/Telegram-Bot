"use strict";

const functions = require("firebase-functions");
const orchestrator = require("../../orchestrator");

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
      {
        command: "/listpoll",
        description: "Show list of available polls",
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

  bot.command("register", async (ctx) => {
    functions.logger.info("Register");
    const message = ctx.update.message;
    functions.logger.info(message);
    const requesterId = message.from.id;
    const requesterName = message.from.first_name;
    if (message.chat.type === "group") {
      const groupId = message.chat.id;
      if (await orchestrator.checkIfGroupExist(groupId)) {
        ctx.reply(
          "Already Registered, this group will receieve automated polls.\n" +
            `Requested by [${requesterName}](tg://user?id=${requesterId})`,
          { parse_mode: "Markdown" }
        );
      } else {
        await orchestrator.registerGroup(groupId, message.chat, message.from, message.date);
        ctx.reply(
          "Registered, this group will receieve automated polls.\n" +
            `Requested by [${requesterName}](tg://user?id=${requesterId})`,
          { parse_mode: "Markdown" }
        );
      }
    } else {
      ctx.reply(
        "Registration failed, only groups are allowed to register.\n" +
          `Requested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    }
  });

  bot.command("deregister", async (ctx) => {
    functions.logger.info("Exit");
    const message = ctx.update.message;
    functions.logger.info(message);
    const requesterId = message.from.id;
    const requesterName = message.from.first_name;
    if (message.chat.type === "group") {
      const groupId = message.chat.id;
      if (await orchestrator.checkIfGroupExist(groupId)) {
        await orchestrator.deRegisteredGroup(groupId);
        ctx.reply(
          "Deregistered, this group has been removed from automated polls.\n" +
            `Requested by [${requesterName}](tg://user?id=${requesterId})`,
          { parse_mode: "Markdown" }
        );
      } else {
        ctx.reply(
          "Not Registered, this group was not regsistered to receieve automated polls.\n" +
            `Requested by [${requesterName}](tg://user?id=${requesterId})`,
          { parse_mode: "Markdown" }
        );
      }
    } else {
      ctx.reply(
        "Deregistered failed, only groups are allowed to deregister.\n" +
          `Requested by [${requesterName}](tg://user?id=${requesterId})`,
        { parse_mode: "Markdown" }
      );
    }
  });

  bot.command("listpoll", (ctx) => {
    functions.logger.info("List Poll");
    ctx.reply("Still in development");
  });
};
