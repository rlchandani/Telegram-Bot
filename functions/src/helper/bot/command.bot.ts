import { logger } from "firebase-functions";
import {
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
  commandVsSPY
} from "./bot_orchestration";
import {
  addExpiringMessage,
  sendReportForTopMentionedByCountToGroups
} from "../../orchestrators";
import { MessageAction } from "../../model/messageAction.model";
import { expireIn3Hours } from "../timeUtil";

export const botRegisterCommand = (bot: any) => {
  bot.start(async (ctx: any) => {
    logger.info("Telegram Event: Start");
    const message = ctx.update.message;
    const replyMessage = await ctx.reply(`Welcome ${ctx.update.message.from.first_name},\n\n` +
        "You are now connected to Masala Bot.\n\n" +
        "Use /help to get the list of supported commands.");
    await addExpiringMessage(
      replyMessage.chat.id,
      replyMessage.message_id,
      MessageAction.DELETE,
      expireIn3Hours()
    );
    await addExpiringMessage(
      message.chat.id,
      message.message_id,
      MessageAction.DELETE,
      expireIn3Hours()
    );
  });

  bot.help(async (ctx: any) => {
    logger.info("Telegram Event: Help");
    const message = ctx.update.message;
    const commands = await ctx.getMyCommands();
    const header = "You can control me by sending these commands:\n\n";
    const footer =
      "\n\n*Legends for ticker quotes:*\n🥇 - Large Cap\n🥈 - Mid Cap\n🥉 - Small Cap\n🥉🥉 - Tiny Cap\n";
    const info = commands.reduce(
      (acc: any, val: any) => `${acc}/${val.command} - ${val.description}\n`,
      ""
    );
    const replyMessage = await ctx.reply(header + info + footer, { parse_mode: "Markdown" });
    await addExpiringMessage(
      replyMessage.chat.id,
      replyMessage.message_id,
      MessageAction.DELETE,
      expireIn3Hours()
    );
    await addExpiringMessage(
      message.chat.id,
      message.message_id,
      MessageAction.DELETE,
      expireIn3Hours()
    );
  });

  bot.settings(async (ctx: any) => {
    const message = ctx.update.message;
    await ctx.setMyCommands([
      {
        command: "/status",
        description: "Get current status with available services"
      },
      {
        command: "/about",
        description: "Get information about this bot and his developer"
      },
      {
        command: "/help",
        description: "Find help"
      },
      {
        command: "/start",
        description: "Start the interaction with this bot"
      },
      {
        command: "/register",
        description: "Register this group to available services"
      },
      {
        command: "/deregister",
        description: "Deregister this group from all registered services"
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
        description: "Get stock quote. Eg: Need ticker symbol as parameter"
      },
      {
        command: "/spy",
        description:
          "Get stock quote with YTD w.r.t SPY. Eg: Need ticker symbol as parameter"
      },
      {
        command: "/news",
        description:
          "Get latest news for stock quote. Eg: Need ticker symbol as parameter"
      },
      {
        command: "/up500",
        description: "Get a list of the top S&P500 movers up for the day"
      },
      {
        command: "/down500",
        description: "Get a list of the top S&P500 movers down for the day"
      },
      {
        command: "/watch",
        description:
          "Add to watchlist. Eg: /watch TSLA or /watch to get top 10 by performance"
      }
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
    await addExpiringMessage(
      replyMessage.chat.id,
      replyMessage.message_id,
      MessageAction.DELETE,
      expireIn3Hours()
    );
    await addExpiringMessage(
      message.chat.id,
      message.message_id,
      MessageAction.DELETE,
      expireIn3Hours()
    );
  });

  /* bot.command("quit", (ctx) => {
    logger.info("Telegram Event: Command Quit");
    await ctx.reply("Thank you for using Masala Bot. \nQuitting the group on your request.");
    ctx.leaveChat();
  }); */

  bot.command("status", async (ctx: any) => {
    logger.info("Telegram Event: Command Status");
    await commandStatus(ctx);
  });

  bot.command("about", async (ctx: any) => {
    logger.info("Telegram Event: Command About");
    await ctx.reply("Made with ❤️, developed by Rohit Lal Chandani");
  });

  bot.command("quote", async (ctx: any) => {
    logger.info("Telegram Event: Command Quote");
    await commandQuote(ctx);
  });

  bot.command("spy", async (ctx: any) => {
    logger.info("Telegram Event: Command Vs SPY");
    await commandVsSPY(ctx);
  });

  // bot.command("history", async (ctx) => {
  //   logger.info("Telegram Event: Command History");
  //   await commandHistory(ctx);
  // });

  bot.command("up500", async (ctx: any) => {
    logger.info("Telegram Event: Command SP500 Up");
    await commandSp500Up(ctx);
  });

  bot.command("down500", async (ctx: any) => {
    logger.info("Telegram Event: Command SP500 Down");
    await commandSp500Down(ctx);
  });

  bot.command("news", async (ctx: any) => {
    logger.info("Telegram Event: Command News");
    await commandNews(ctx);
  });

  // bot.command("buy", async (ctx: any) => {
  //   logger.info("Telegram Event: Command Buy");
  //   await commandBuy(ctx);
  // });

  // bot.command("sell", async (ctx) => {
  //   logger.info("Telegram Event: Command Sell");
  //   await commandSell(ctx);
  // });

  bot.command("register", async (ctx: any) => {
    logger.info("Telegram Event: Command Register");
    await commandRegister(ctx);
  });

  bot.command("deregister", async (ctx: any) => {
    logger.info("Telegram Event: Command Exit");
    await commandDeRegister(ctx);
  });

  bot.command("createpoll", async (ctx: any) => {
    logger.info("Telegram Event: Command Create Poll");
    await commandCreatePoll(ctx);
  });

  bot.command("listpoll", async (ctx: any) => {
    logger.info("Telegram Event: Command List Poll");
    await commandListPoll(ctx);
  });

  bot.command("watch", async (ctx: any) => {
    logger.info("Telegram Event: Command Watch");
    await commandWatch(ctx);
  });

  bot.command("testReport", async (ctx: any) => {
    logger.info("Telegram Event: Command Test Report");
    const message = ctx.update.message;
    await sendReportForTopMentionedByCountToGroups(ctx, message.chat.id);
  });
};
