import _ from "lodash";
import { logger } from "firebase-functions";
import { MessageAction } from "../model/messageAction.model";
import { getExpiringMessages, removeExpiringMessageForGroup } from "./expiringMessage.orchestrator";
import { telegramDeleteMessage, telegramUnpinChatMessage } from "./telegram.orchestrator";

export interface ExpiringMessage {
  messageId: number;
  action: MessageAction;
}

const expireMessages = async (bot: any, overrideEndHour = 0) => {
  const actionRequestList: Promise<void>[] = [];
  const deleteFromTableRequestList: Promise<void>[] = [];

  const messages: ExpiringMessage[] = await getExpiringMessages(overrideEndHour);
  for (const [expiringTime, groupWithMessages] of _.entries(messages)) {
    for (const [groupId, messages] of _.entries(groupWithMessages)) {
      logger.info(`Expiring messages for time: ${expiringTime} and groupId: ${groupId}`);
      _.forEach(messages, (message: ExpiringMessage) => {
        switch (message.action) {
          case MessageAction.DELETE:
            logger.info(`Expiring messageId: ${message.messageId} for action: ${message.action}`);
            actionRequestList.push(telegramDeleteMessage(bot, groupId, message.messageId));
            break;
          case MessageAction.UNPIN:
            logger.info(`Expiring messageId: ${message.messageId} for action: ${message.action}`);
            actionRequestList.push(telegramUnpinChatMessage(bot, groupId, message.messageId));
            break;
          default:
            logger.log(`Expiring message action not defined. Action: ${message.action}`);
        }
      });
      deleteFromTableRequestList.push(removeExpiringMessageForGroup(expiringTime, groupId));
    }
  }
  await Promise.all(actionRequestList);
  await Promise.all(deleteFromTableRequestList);
};

export { expireMessages };
