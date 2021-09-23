/* eslint-disable no-case-declarations */
import { logger } from "firebase-functions";
import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { addUser, addGroup, addMessage } from "../../orchestrators";

export const botRegisterMiddleware = (bot: Telegraf<Context<Update>>) => {
  bot.use(async (ctx, next) => {
    const promises: Promise<void>[] = [];
    switch (ctx.updateType) {
      case "message":
        const message = ctx.message;
        if (message !== undefined) {
          try {
            promises.push(addUser(message.from.id, message.from, message.date));
            promises.push(addGroup(
              message.chat.id,
              message.chat,
              message.from.id,
              message.date
            ));
            promises.push(addMessage(message.chat.id, message));
          } catch (e) {
            logger.error("Failed in pre-middleware processing", e);
          }
        }
        break;
      default:
        logger.error(`Unhandled updateType: ${ctx.updateType}`, ctx.update);
    }
    await next(); // runs next middleware
    await Promise.all(promises);
  });
};
