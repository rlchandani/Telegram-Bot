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
} = require("./bot_orchestration");
const {
  sendReportForTopMentionedByCountToGroups,
  sendReportForTopMentionedByPerformanceToGroups,
} = require("../../orchestrator");

/* const { Markup } = require("telegraf");

const keyboard = Markup.inlineKeyboard([
  Markup.button.url("❤️", "http://telegraf.js.org"),
  Markup.button.callback("Delete", "delete"),
]); */

exports.register = (bot) => {
  bot.start(async (ctx) => {
    functions.logger.info("Telegram Event: Start");
    await ctx.reply(
      `Welcome ${ctx.update.message.from.first_name},\n\n` +
        "You are now connected to Masala Bot.\n\n" +
        "Use /help to get the list of supported commands."
    );
  });

  bot.help(async (ctx) => {
    functions.logger.info("Telegram Event: Help");
    const commands = await ctx.getMyCommands();
    const info = commands.reduce((acc, val) => `${acc}/${val.command} - ${val.description}\n`, "");
    await ctx.reply("You can control me by sending these commands:\n\n" + info);
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
    await ctx.reply("Bot configured");
  });

  /* bot.command("quit", (ctx) => {
    functions.logger.info("Telegram Event: Command Quit");
    await ctx.reply("Thank you for using Masala Bot. \nQuitting the group on your request.");
    ctx.leaveChat();
  }); */

  bot.command("about", async (ctx) => {
    functions.logger.info("Telegram Event: Command About");
    await ctx.reply("Made with ❤️, developed by Rohit Lal Chandani");
  });

  bot.command("quote", async (ctx) => {
    functions.logger.info("Telegram Event: Command Quote");
    await commandQuote(ctx);
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

  bot.command("testReport", async (ctx) => {
    functions.logger.info("Telegram Event: Command Test Report");
    const message = ctx.update.message;
    sendReportForTopMentionedByCountToGroups(ctx, message.chat.id);
    sendReportForTopMentionedByPerformanceToGroups(ctx, message.chat.id);
  });
};
