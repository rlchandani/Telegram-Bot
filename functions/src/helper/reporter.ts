import _ from "lodash";
import { getMentionedTickerByDaysForGroup } from "../orchestrators";
import { generateHydrationValues } from "../api/helpers/hydration.helpers";
import { NodeHydrationValues } from "../api/models/types.hydration";
import { MentionedTickerRecord } from "../model/dao";

const getTopMentionedTickersByCount = async (groupId: string, days: number[]) => {
  const responseTickerInfo: any = {};
  const responseData: MentionedTickerRecord[] = await getMentionedTickerByDaysForGroup(groupId, days);
  responseData.forEach((data: MentionedTickerRecord) =>
    Object.values(data).forEach((value: any) => {
      const tickerSymbol: string = value.symbol;
      if (tickerSymbol in responseTickerInfo) {
        responseTickerInfo[tickerSymbol] += 1;
      } else {
        responseTickerInfo[tickerSymbol] = 1;
      }
    }));
  const stockListQuote = await generateHydrationValues(Object.keys(responseTickerInfo));
  Object.keys(responseTickerInfo).forEach((symbol) => {
    const stockQuote = stockListQuote.filter((item: NodeHydrationValues) => item.appendix?.symbol === symbol)[0];
    stockQuote.appendix!.mentionedCount = responseTickerInfo[symbol];
  });
  return _.orderBy(
    stockListQuote,
    [
      "appendix.mentionedCount",
      "appendix.todayPLPercentage",
      "appendix.lastExtendedHoursTradePrice",
      "appendix.lastTradePrice",
      "appendix.symbol"
    ],
    ["desc"]
  );
};

const getWatchlistTickersByPerformanceGroupBySector = async (groupId: string) => {
  const response = await getWatchlistTickersByPerformance(groupId);
  return _.mapValues(_.groupBy(response, "sector"), (v) =>
    _.orderBy(v, ["pl_percentage", "pl", "last_trade_price", "symbol"], ["desc", "desc", "desc", "asc"]));
};

const getTopMentionedTickersByPerformance = async (groupId: string, days: number[]) => {
  return [{}];
};

const getWatchlistTickersByPerformance = async (groupId: string) => {
  return [{}];
};

export {
  getTopMentionedTickersByCount,
  getTopMentionedTickersByPerformance,
  getWatchlistTickersByPerformance,
  getWatchlistTickersByPerformanceGroupBySector
};
