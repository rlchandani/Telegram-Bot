import { logger } from "firebase-functions";
import { Context, Telegraf } from "telegraf";
import { botRegisterMiddleware } from "./middleware.bot";
import { botRegisterAction } from "./action.bot";
import { botRegisterCommand } from "./command.bot";
import { botRegisterOn } from "./on.bot";
import { firebaseConfig } from "../../helper/firebase_config";
import { Update } from "telegraf/typings/core/types/typegram";

export const initTelegraf = () => {
  const bot: Telegraf<Context<Update>> = new Telegraf(firebaseConfig.telegram.bot_token);

  // Registering middleware
  botRegisterMiddleware(bot);

  // Registering commands
  botRegisterCommand(bot);

  // Registering On
  botRegisterOn(bot);

  // Registering Actions
  botRegisterAction(bot);

  // error handling
  bot.catch((err: any, ctx: any) => {
    logger.error("[Bot] Error", err);
    return ctx.reply(`Ooops, encountered an error for ${ctx.updateType}`, err);
  });

  return bot;
};
