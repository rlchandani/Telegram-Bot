const telegramDeleteMessage = async (bot: any, groupId: any, messageId: any) => {
  try {
    await bot.telegram.deleteMessage(groupId, messageId);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to delete messageId: ${messageId} from groupId: ${groupId}`, error.message);// It's an Error instance.
    } else {
      console.error("🤷‍♂️"); // Who knows?
    }
  }
};

const telegramPinChatMessage = async (bot: any, groupId: any, messageId: any) => {
  try {
    await bot.telegram.pinChatMessage(groupId, messageId);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to pin messageId: ${messageId} from groupId: ${groupId}`, error.message); // It's an Error instance.
    } else {
      console.error("🤷‍♂️"); // Who knows?
    }
  }
};

const telegramUnpinChatMessage = async (bot: any, groupId: any, messageId: any) => {
  try {
    await bot.telegram.unpinChatMessage(groupId, messageId);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to unpin messageId: ${messageId} from groupId: ${groupId}`, error.message); // It's an Error instance.
    } else {
      console.error("🤷‍♂️"); // Who knows?
    }
  }
};

export { telegramDeleteMessage, telegramPinChatMessage, telegramUnpinChatMessage };
