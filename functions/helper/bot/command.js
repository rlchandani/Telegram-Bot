"use strict";

const functions = require("firebase-functions");
const {
  commandQuote,
  commandSp500Up,
  commandSp500Down,
  commandNews,
  commandRegister,
  commandDeRegister,
  commandCreatePoll,
  commandListPoll,
  commandWatch,
  commandStatus,
  commandVsSPY,
} = require("./bot_orchestration");
const {
  registerExpiringMessage,
  sendReportForTopMentionedByCountToGroups,
  sendReportForTopMentionedByPerformanceToGroups,
} = require("../../orchestrator");
const messageAction = require("../../model/message_action");
const timeUtil = require("../timeUtil");

exports.register = (bot) => {
  bot.start(async (ctx) => {
    functions.logger.info("Telegram Event: Start");
    const message = ctx.update.message;
    const replyMessage = await ctx.reply(
      `Welcome ${ctx.update.message.from.first_name},\n\n` +
        "You are now connected to Masala Bot.\n\n" +
        "Use /help to get the list of supported commands."
    );
    await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
    await registerExpiringMessage(message.chat.id, message.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
  });

  bot.help(async (ctx) => {
    functions.logger.info("Telegram Event: Help");
    const message = ctx.update.message;
    const commands = await ctx.getMyCommands();
    const header = "You can control me by sending these commands:\n\n";
    const footer = "\n\n*Legends for ticker quotes:*\n🥇 - Large Cap\n🥈 - Mid Cap\n🥉 - Small Cap\n🥉🥉 - Tiny Cap\n";
    const info = commands.reduce((acc, val) => `${acc}/${val.command} - ${val.description}\n`, "");
    const replyMessage = await ctx.reply(header + info + footer, { parse_mode: "Markdown" });
    await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
    await registerExpiringMessage(message.chat.id, message.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
  });

  bot.settings(async (ctx) => {
    const message = ctx.update.message;
    await ctx.setMyCommands([
      {
        command: "/status",
        description: "Get current status with available services",
      },
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
        description: "Register this group to available services",
      },
      {
        command: "/deregister",
        description: "Deregister this group from all registered services",
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
      {
        command: "/spy",
        description: "Get stock quote with YTD w.r.t SPY. Eg: Need ticker symbol as parameter",
      },
      {
        command: "/news",
        description: "Get latest news for stock quote. Eg: Need ticker symbol as parameter",
      },
      {
        command: "/up500",
        description: "Get a list of the top S&P500 movers up for the day",
      },
      {
        command: "/down500",
        description: "Get a list of the top S&P500 movers down for the day",
      },
      {
        command: "/watch",
        description: "Add to watchlist. Eg: /watch TSLA or /watch to get top 10 by performance",
      },
      // {
      //   command: "/history",
      //   description: "Get stock price history",
      // },
      // {
      //   command: "/buy",
      //   description: "Paper trade: Buy stock. Eg: Need ticker symbol as parameter",
      // },
      // {
      //   command: "/sell",
      //   description: "Paper trade: Sell stock. Eg: Need ticker symbol as parameter",
      // },
    ]);
    const replyMessage = await ctx.reply("Bot configured");
    await registerExpiringMessage(replyMessage.chat.id, replyMessage.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
    await registerExpiringMessage(message.chat.id, message.message_id, messageAction.DELETE, timeUtil.expireIn3Hours());
  });

  /* bot.command("quit", (ctx) => {
    functions.logger.info("Telegram Event: Command Quit");
    await ctx.reply("Thank you for using Masala Bot. \nQuitting the group on your request.");
    ctx.leaveChat();
  }); */

  bot.command("status", async (ctx) => {
    functions.logger.info("Telegram Event: Command Status");
    await commandStatus(ctx);
  });

  bot.command("about", async (ctx) => {
    functions.logger.info("Telegram Event: Command About");
    await ctx.reply("Made with ❤️, developed by Rohit Lal Chandani");
  });

  bot.command("quote", async (ctx) => {
    functions.logger.info("Telegram Event: Command Quote");
    await commandQuote(ctx);
  });

  bot.command("spy", async (ctx) => {
    functions.logger.info("Telegram Event: Command Vs SPY");
    await commandVsSPY(ctx);
  });

  // bot.command("history", async (ctx) => {
  //   functions.logger.info("Telegram Event: Command History");
  //   await commandHistory(ctx);
  // });

  bot.command("up500", async (ctx) => {
    functions.logger.info("Telegram Event: Command SP500 Up");
    await commandSp500Up(ctx);
  });

  bot.command("down500", async (ctx) => {
    functions.logger.info("Telegram Event: Command SP500 Down");
    await commandSp500Down(ctx);
  });

  bot.command("news", async (ctx) => {
    functions.logger.info("Telegram Event: Command News");
    await commandNews(ctx);
  });

  // bot.command("buy", async (ctx) => {
  //   functions.logger.info("Telegram Event: Command Buy");
  //   await commandBuy(ctx);
  // });

  // bot.command("sell", async (ctx) => {
  //   functions.logger.info("Telegram Event: Command Sell");
  //   await commandSell(ctx);
  // });

  bot.command("register", async (ctx) => {
    functions.logger.info("Telegram Event: Command Register");
    await commandRegister(ctx);
  });

  bot.command("deregister", async (ctx) => {
    functions.logger.info("Telegram Event: Command Exit");
    await commandDeRegister(ctx);
  });

  bot.command("createpoll", async (ctx) => {
    functions.logger.info("Telegram Event: Command Create Poll");
    await commandCreatePoll(ctx);
  });

  bot.command("listpoll", async (ctx) => {
    functions.logger.info("Telegram Event: Command List Poll");
    await commandListPoll(ctx);
  });

  bot.command("watch", async (ctx) => {
    functions.logger.info("Telegram Event: Command Watch");
    await commandWatch(ctx);
  });

  bot.command("testReport", async (ctx) => {
    functions.logger.info("Telegram Event: Command Test Report");
    const message = ctx.update.message;
    await sendReportForTopMentionedByCountToGroups(ctx, message.chat.id);
    await sendReportForTopMentionedByPerformanceToGroups(ctx, message.chat.id);
  });
};
