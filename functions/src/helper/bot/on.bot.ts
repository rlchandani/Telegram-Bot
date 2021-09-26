import { logger } from "firebase-functions";
import { Markup } from "telegraf";
import { onText, onNewChatMembers } from "./bot_orchestration";
const fetch = require("node-fetch").default;

export const botRegisterOn = (bot: any) => {
  // UpdateTypes
  /* bot.on("callback_query", (ctx) => {
    logger.info("Telegram Event: On Callback Query");
    logger.info(ctx.update.message);
    ctx.answerCbQuery();
  });
  */
  bot.on("inline_query", async (ctx: any) => {
    logger.info("Telegram Event: On Inline Query");
    const apiUrl = `http://recipepuppy.com/api/?q=${ctx.inlineQuery.query}`;
    const response = await fetch(apiUrl);
    const { results } = await response.json();
    const recipes = results
      // @ts-ignore
      .filter(({ thumbnail }) => thumbnail)
      // @ts-ignore
      .map(({ title, href, thumbnail }) => ({
        type: "article",
        id: thumbnail,
        title: title,
        description: title,
        thumb_url: thumbnail,
        input_message_content: { message_text: title },
        reply_markup: Markup.inlineKeyboard([Markup.button.url("Go to recipe", href)])
      }));
    logger.log(recipes);
    ctx.answerInlineQuery(recipes);
  });
  /*
  bot.on("poll", (ctx) => {
    logger.info("Telegram Event: On Poll");
    logger.info(ctx.poll);
  });

  bot.on("poll_answer", (ctx) => {
    logger.info("elegram Event: On Poll Answer");
    logger.info(ctx.update.poll_answer);
  });

  bot.on(["sticker", "photo", "video"], async (ctx) => {
    logger.info("elegram Event: On Sticker/Photo/Video");
    logger.info(ctx.update.message);
    await ctx.reply("👍🏻");
  }); */

  // MessageSubType
  bot.on("text", async (ctx: any) => {
    logger.info("Telegram Event: On Text");
    await onText(ctx);
  });

  bot.on("edited_message", async (ctx: any) => {
    logger.info("Telegram Event: Edited Message");
    await onText(ctx);
  });

  bot.on(["new_chat_members"], async (ctx: any) => {
    logger.info("Telegram Event: On New Member");
    await onNewChatMembers(ctx);
  });
};
