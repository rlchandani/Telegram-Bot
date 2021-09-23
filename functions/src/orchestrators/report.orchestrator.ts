import moment from "moment-timezone";
import {
  getTopMentionedTickersByCount,
  getTopMentionedTickersByPerformance,
  getWatchlistTickersByPerformance,
  getWatchlistTickersByPerformanceGroupBySector
} from "../helper/reporter";
import { currentWeekDays } from "../helper/timeUtil";
import { getGroupById, getAllGroups } from "./group.orchestrator";
import { getPriceMovementIcon } from "../helper/utils";
import { NodeHydrationValues } from "../api/models/types.hydration";

const sendReportForWatchlistByPerformanceToGroups = async (bot: any, groupId: any) => {
  try {
    const group = await getGroupById(groupId);
    const watchlistTickersByPerformance = await getWatchlistTickersByPerformance(group.id);
    const messageText = watchlistTickersByPerformance.slice(0, 10).map((item: any) => {
      return (
        `*Ticker:* [${item.symbol}](https://robinhood.com/stocks/${item.symbol}) ${item.country_flag} (${item.country})\n` +
        `*Sector:* ${item.sector}\n` +
        `*Added On:* \`\`\`${moment.unix(item.first_mentioned_on).format("YYYY-MM-DD")}\`\`\` ($${item.first_mentioned_price})\n` +
        `*Current Price:* \`\`\`$${item.last_trade_price}\`\`\`\n` +
        `*Total P/L:* \`\`\`$${item.pl}\`\`\` (${item.pl_percentage}%) ${getPriceMovementIcon(item.pl)}\n`
      );
    });
    if (messageText.length > 0) {
      const groupName = group.type === "group" ? group.title : group.first_name;
      const headerText = `*Watchlist Status:* ${groupName}\nTop 10 performaning stocks from watchlist:\n\n`;
      await bot.telegram.sendMessage(group.id, headerText + messageText.join("\n"), {
        parse_mode: "Markdown",
        disable_web_page_preview: true
      });
    } else {
      await bot.telegram.sendMessage(groupId, "Watchlist is empty!", { parse_mode: "Markdown" });
    }
  } catch (err) {
    await bot.telegram.sendMessage(
      groupId,
      "Group is not registered to receive response.\nPlease register using /register",
      { parse_mode: "Markdown" }
    );
  }
};

const sendReportForWatchlistByPerformanceGroupBySectorToGroups = async (bot: any, groupId: any) => {
  const promises = [];

  try {
    const group = await getGroupById(groupId);
    const watchlistTickersByPerformanceGroupBySector = await getWatchlistTickersByPerformanceGroupBySector(group.id);
    let replyMessageText = "";
    Object.keys(watchlistTickersByPerformanceGroupBySector).forEach((sector) => {
      const watchlistTickersByPerformance = watchlistTickersByPerformanceGroupBySector[sector];
      const messageText = watchlistTickersByPerformance.slice(0, 1).map((item: any) => {
        return `*Ticker:* [${item.symbol}](https://robinhood.com/stocks/${item.symbol}) ${item.country_flag} (\`\`\`$${item.last_trade_price}\`\`\`)`;
      });
      if (messageText.length > 0) {
        replyMessageText += `\n\n*Sector:* ${sector}\n` + messageText.join("\n");
      }
    });
    if (replyMessageText) {
      const groupName = group.type === "group" ? group.title : group.first_name;
      const headerText = `*Watchlist Status:* ${groupName}\nTop 10 performaning stocks from watchlist per sector:`;
      promises.push(bot.telegram.sendMessage(group.id, headerText + replyMessageText, {
        parse_mode: "Markdown",
        disable_web_page_preview: true
      }));
    } else {
      promises.push(bot.telegram.sendMessage(groupId, "Watchlist is empty!", { parse_mode: "Markdown" }));
    }
  } catch (err) {
    await bot.telegram.sendMessage(
      groupId,
      "Group is not registered to receive response.\nPlease register using /register",
      { parse_mode: "Markdown" }
    );
  }

  await Promise.all(promises);
};

const sendReportForTopMentionedByPerformanceToGroups = async (bot: any, overrideGroupId: any) => {
  const promises: any[] = [];
  const groups = await getAllGroups();
  groups.forEach(async (group) => promises.push(_sendReportForTopMentionedByPerformanceToGroups(bot, group, overrideGroupId)));
  await Promise.all(promises);
};

const _sendReportForTopMentionedByPerformanceToGroups = async (bot: any, group: any, overrideGroupId: any) => {
  const period = currentWeekDays("America/Los_Angeles");
  const periodStart = moment.unix(period[0]).tz("America/Los_Angeles").format("MM/DD");
  const periodEnd = moment
    .unix(period[period.length - 1])
    .tz("America/Los_Angeles")
    .format("MM/DD z");
  const topMentionedTickersByPerformance = await getTopMentionedTickersByPerformance(group.id, period);
  const pennyStockMessage = topMentionedTickersByPerformance
    .filter((stockQuote: NodeHydrationValues) => stockQuote.appendix?.tradePrice < 10)
    .slice(0, 5)
    .map((stockQuote: NodeHydrationValues) => stockQuote.appendix?.displayMessageStockQuote);
  const mediumStockMessage = topMentionedTickersByPerformance
    .filter((stockQuote: NodeHydrationValues) => stockQuote.appendix?.tradePrice > 10 && stockQuote.appendix?.tradePrice < 200)
    .slice(0, 5)
    .map((stockQuote: NodeHydrationValues) => stockQuote.appendix?.displayMessageStockQuote);
  const premiumStockMessage = topMentionedTickersByPerformance
    .filter((stockQuote: NodeHydrationValues) => stockQuote.appendix?.tradePrice > 200)
    .slice(0, 5)
    .map((stockQuote: NodeHydrationValues) => stockQuote.appendix?.displayMessageStockQuote);
  const messageText =
        `\n*Penny-Stocks:*\n\`-----------------------\`\n${pennyStockMessage.length > 0 ? pennyStockMessage.join("\n") : "No Stocks"}` +
        `\n*Medium-Stocks:*\n\`-----------------------\`\n${mediumStockMessage.length > 0 ? mediumStockMessage.join("\n") : "No Stocks"}` +
        `\n*Premium-Stocks:*\n\`-----------------------\`\n${premiumStockMessage.length > 0 ? premiumStockMessage.join("\n") : "No Stocks"}`;
    // const groupName = group.type == "group" ? group.title : group.first_name;
  const headerText = `*Weekly Report By Performance*\n*Period:* ${periodStart} - ${periodEnd}\n`;
  return await bot.telegram.sendMessage(overrideGroupId || group.id, headerText + messageText, {
    parse_mode: "Markdown",
    disable_web_page_preview: true
  });
};

const sendReportForTopMentionedByCountToGroups = async (bot: any, overrideGroupId: any) => {
  const promises: any[] = [];
  const groups = await getAllGroups();
  groups.forEach(async (group) => promises.push(_sendReportForTopMentionedByCountToGroups(bot, group, overrideGroupId)));
  await Promise.all(promises);
};

const _sendReportForTopMentionedByCountToGroups = async (bot: any, group: any, overrideGroupId: any) => {
  const period = currentWeekDays("America/Los_Angeles");
  const periodStart = moment.unix(period[0]).tz("America/Los_Angeles").format("MM/DD");
  const periodEnd = moment
    .unix(period[period.length - 1])
    .tz("America/Los_Angeles")
    .format("MM/DD z");
  const topMentionedTickerByCount = await getTopMentionedTickersByCount(group.id, period);
  const pennyStockMessage = topMentionedTickerByCount
    .filter((stockQuote: NodeHydrationValues) => stockQuote.appendix?.tradePrice < 10)
    .slice(0, 5)
    .map((stockQuote: NodeHydrationValues) => stockQuote.appendix?.displayMessageStockQuote);
  const mediumStockMessage = topMentionedTickerByCount
    .filter((stockQuote: NodeHydrationValues) => stockQuote.appendix?.tradePrice > 10 && stockQuote.appendix?.tradePrice < 200)
    .slice(0, 5)
    .map((stockQuote: NodeHydrationValues) => stockQuote.appendix?.displayMessageStockQuote);
  const premiumStockMessage = topMentionedTickerByCount
    .filter((stockQuote: NodeHydrationValues) => stockQuote.appendix?.tradePrice > 200)
    .slice(0, 5)
    .map((stockQuote: NodeHydrationValues) => stockQuote.appendix?.displayMessageStockQuote);
  const messageText =
        `\n*Penny-Stocks:*\n\`-----------------------\`\n${pennyStockMessage.length > 0 ? pennyStockMessage.join("\n") : "No Stocks"}` +
        `\n*Medium-Stocks:*\n\`-----------------------\`\n${mediumStockMessage.length > 0 ? mediumStockMessage.join("\n") : "No Stocks"}` +
        `\n*Premium-Stocks:*\n\`-----------------------\`\n${premiumStockMessage.length > 0 ? premiumStockMessage.join("\n") : "No Stocks"}`;
    // const groupName = group.type == "group" ? group.title : group.first_name;
  const headerText = `*Weekly Report By Count*\n*Period:* ${periodStart} - ${periodEnd}\n`;
  return await bot.telegram.sendMessage(overrideGroupId || group.id, headerText + messageText, {
    parse_mode: "Markdown",
    disable_web_page_preview: true
  });
};

export {
  sendReportForWatchlistByPerformanceToGroups,
  sendReportForWatchlistByPerformanceGroupBySectorToGroups,
  sendReportForTopMentionedByPerformanceToGroups,
  sendReportForTopMentionedByCountToGroups
};
