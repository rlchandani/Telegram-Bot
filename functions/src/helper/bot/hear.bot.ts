import { logger } from "firebase-functions";

export const botRegisterHear = (bot: any) => {
  bot.hears("hi", async (ctx: any) => {
    logger.info("Telegram Event: Hear Hi");
    await ctx.reply(`Hello ${ctx.update.message.from.first_name}`);
  });
};
