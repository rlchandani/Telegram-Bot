import { logger } from "firebase-functions";
import { getAllGroups } from "./group.orchestrator";
import { telegramPinChatMessage } from "./telegram.orchestrator";
import { addExpiringMessage } from "./expiringMessage.orchestrator";
import { addPinnedMessage } from "./pinnedMessage.orchestrator";
import { MessageAction } from "../model/messageAction.model";
import { MessageType } from "../model/messageType.model";
import { expireIn3Hours } from "../helper/timeUtil";
import { getTodayEventIndia, getTodayEventUSA } from "../helper/google/calendar";
import { firebaseConfig } from "../helper/firebase_config";

const sendPollToRegisteredGroups = async (bot: any, question: any, options: any, messageType: any, extra?: any) => {
  const snapshot = await getAllGroups("scheduled_polls");
  const promises: Promise<void>[] = [];
  snapshot.forEach(async (group: any) => promises.push(_sendPollToRegisteredGroups(bot, question, options, group, messageType, extra)));
  await Promise.all(promises);
};

const _sendPollToRegisteredGroups = async (bot: any, question: any, options: any, group: any, messageType: any, extra?: any) => {
  logger.info(`Sending poll to ${group.id}`);
  const replyMessage = await bot.telegram.sendPoll( group.id, question, options, extra);
  try {
    await telegramPinChatMessage(bot, group.id, replyMessage.message_id);
    await addExpiringMessage(replyMessage.chat.id, replyMessage.message_id, MessageAction.UNPIN, expireIn3Hours());
    await addPinnedMessage( group.id, replyMessage.message_id, question, messageType);
  } catch (err) {
    console.error(`Failed to pin messageId: ${replyMessage.message_id} to groupId: ${group.id}`, err);
  }
};

const sendMessageToRegisteredGroups = async (bot: any, groupFilter: any, messageText: any, messageType: any, extra?: any) => {
  const snapshot = await getAllGroups(groupFilter);
  const promises: Promise<void>[] = [];
  snapshot.forEach((group: any) => {
    if (messageText) {
      promises.push(_sendMessageToRegisteredGroups(bot, group, messageText, messageType, extra));
    }
  });
  await Promise.all(promises);
};

const _sendMessageToRegisteredGroups = async (bot: any, group: any, messageText: any, messageType: any, extra?: any) => {
  logger.info(`Sending message to ${group.id}`);
  const replyMessage = await bot.telegram.sendMessage(group.id, messageText, extra);
  try {
    await addPinnedMessage(group.id, replyMessage.message_id, messageText, messageType);
  } catch (err) {
    console.error(`Failed to register pinned messageId: ${replyMessage.message_id} to groupId: ${group.id}`, err);
  }
};

const usaHoliday = async (bot: any) => {
  const me = await bot.telegram.getMe();
  const usaEvents = await getTodayEventUSA(firebaseConfig.google.api_key);
  if (usaEvents.length === 0) {
    logger.info("No USA events found for today");
  }
  usaEvents.forEach((event: string) => {
    sendMessageToRegisteredGroups(
      bot,
      "holiday_events_usa",
      "To all my American friends,\n\nHappy " + event + "!!! 🎊🎉🥂\n\n Best Wishes\n-" + me.first_name,
      MessageType.USA_HOLIDAY
    );
  });
};

const indiaHoliday = async (bot: any) => {
  const me = await bot.telegram.getMe();
  const indiaEvents = await getTodayEventIndia(firebaseConfig.google.api_key);
  if (indiaEvents.length === 0) {
    logger.info("No Indian events found for today");
  }
  indiaEvents.forEach((event: string) => {
    sendMessageToRegisteredGroups(
      bot,
      "holiday_events_india",
      "To all my Indian friends,\n\nHappy " + event + "!!! 🎊🎉🥂\n\n Best Wishes\n-" + me.first_name,
      MessageType.INDIA_HOLIDAY
    );
  });
};

export { sendPollToRegisteredGroups, sendMessageToRegisteredGroups, usaHoliday, indiaHoliday };
