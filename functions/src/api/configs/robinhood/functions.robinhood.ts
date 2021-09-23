import _ from "lodash";
import moment from "moment";
import { MappingFunction, PostMappingFunction } from "../../models/types.integration";
import { getMarketCapIcon, getPriceMovementIcon, roundToTwo } from "../../common.utils";
import countryCodeToFlag from "country-code-to-flag";

export const concatenate: MappingFunction = {
  inputConsts: [],
  mappingFunction: (inputs: (string | number)[], extras: any[]) => {
    const delimiter = _.head(extras)?.delimiter || " > ";
    const strings = inputs;
    const mappings: (string | number)[] = [];
    const concatenatedStrings = strings.join(delimiter);
    mappings.push(concatenatedStrings);
    return mappings;
  },
  outputValKeys: []
};

export const coalesce: MappingFunction = {
  inputConsts: [],
  mappingFunction: (inputs: (string | number)[], extras: any[]) => {
    return [inputs.find((_: any) => ![null, undefined].includes(_))];
  },
  outputValKeys: []
};

export const pAndLDaily: MappingFunction = {
  inputConsts: [],
  mappingFunction: (inputs: any[], extras: any[]) => {
    const tradePrice = inputs[0];
    const lastTradePrice = inputs[1];
    const lastExtendedHoursTradePrice = inputs[2];
    const previousClose = inputs[3];

    const todayDiff = lastTradePrice - previousClose;
    const todayPLPercentage = (todayDiff * 100) / previousClose;

    const todayAfterHourDiff = lastExtendedHoursTradePrice - lastTradePrice;
    const todayAfterHourPLPercentage = (todayAfterHourDiff * 100) / lastTradePrice;

    const todayFullDayDiff = tradePrice - previousClose;
    const todayFullDayPLPercentage = (todayFullDayDiff * 100) / previousClose;

    return [todayDiff, todayPLPercentage, todayAfterHourDiff, todayAfterHourPLPercentage, todayFullDayDiff, todayFullDayPLPercentage];
  },
  outputValKeys: []
};

export const pAndLYearly: MappingFunction = {
  inputConsts: [],
  mappingFunction: (inputs: any[], extras: any[]) => {
    const historicals = _.head(inputs) || [];
    const previousYear = _.head(extras)?.previousYear;
    const currentYear = _.head(extras)?.currentYear;
    const previousYearStart = moment().tz("America/Los_Angeles").subtract(previousYear, "years").endOf("year").subtract(7, "days").unix();
    const previousYearEnd = moment().tz("America/Los_Angeles").subtract(previousYear, "years").endOf("year").unix();
    let currentYearStart: any = moment().tz("America/Los_Angeles").subtract(currentYear, "years").endOf("year").subtract(7, "days");
    if (currentYearStart.isAfter(moment())) {
      currentYearStart = moment().tz("America/Los_Angeles").subtract(7, "days").unix();
    } else {
      currentYearStart = currentYearStart.unix();
    }
    let currentYearEnd: any = moment().tz("America/Los_Angeles").subtract(currentYear, "years").endOf("year");
    if (currentYearEnd.isAfter(moment())) {
      currentYearEnd = moment().tz("America/Los_Angeles").unix();
    } else {
      currentYearEnd = currentYearEnd.unix();
    }
    const stockQuotePreviousYearStart = historicals
      .filter((h: any) => moment(h.begins_at).unix() >= previousYearStart && moment(h.begins_at).unix() <= previousYearEnd)
      .slice(-1)[0] || { close_price: 0 };
    const stockQuoteCurrentYearStart = historicals
      .filter((h: any) => moment(h.begins_at).unix() >= currentYearStart && moment(h.begins_at).unix() <= currentYearEnd)
      .slice(-1)[0] || { close_price: 0 };
    const currentYearPL = stockQuoteCurrentYearStart.close_price - stockQuotePreviousYearStart.close_price;
    const currentYearPLPercentage = (currentYearPL * 100.00) / stockQuotePreviousYearStart.close_price;
    return [
      +moment().tz("America/Los_Angeles").subtract(currentYear, "years").format("YYYY"),
      +stockQuoteCurrentYearStart.close_price,
      currentYearPL,
      currentYearPLPercentage
    ];
  },
  outputValKeys: []
};

export const processStockRating: MappingFunction = {
  inputConsts: [],
  mappingFunction: (inputs: any[], extras: any[]) => {
    const numBuyRatings = inputs[0];
    const numHoldRatings = inputs[1];
    const numSellRatings = inputs[2];
    const numTotalRating = numBuyRatings + numHoldRatings + numSellRatings;
    const numBuyRatingPercentage = numBuyRatings * 100 / numTotalRating;
    const numHoldRatingPercentage = numHoldRatings * 100 / numTotalRating;
    const numSellRatingPercentage = numSellRatings * 100 / numTotalRating;
    return [numBuyRatingPercentage, numHoldRatingPercentage, numSellRatingPercentage];
  },
  outputValKeys: []
};

export const displayMessageStockQuote: MappingFunction = {
  inputConsts: [],
  mappingFunction: (inputs: any[], extras: any[]) => {
    const symbol = inputs[0];
    const tradePrice = inputs[1];
    const todayDiff = inputs[2];
    const todayPLPercentage = inputs[3];
    const todayPLIcon = getPriceMovementIcon(todayPLPercentage);
    const todayAfterHourDiff = inputs[4];
    const todayAfterHourPLPercentage = inputs[5];
    const todayAfterHourPLIcon = getPriceMovementIcon(todayAfterHourPLPercentage);
    const todayFullDayDiff = inputs[6];
    const todayFullDayPLPercentage = inputs[7];
    const todayFullDayPLIcon = getPriceMovementIcon(todayFullDayPLPercentage);
    const marketCap = inputs[8];
    const marketCapIcon = getMarketCapIcon(marketCap);
    const country = inputs[9];
    const countryFlag = countryCodeToFlag(country || "US");
    const numBuyRatingPercentage = inputs[10];
    const numHoldRatingPercentage = inputs[11];
    const numSellRatingPercentage = inputs[12];
    const tickerText = `[${symbol}](https://robinhood.com/stocks/${symbol})`;
    const ratingMsg = _.isNaN(numBuyRatingPercentage) || _.isNaN(numHoldRatingPercentage) || _.isNaN(numSellRatingPercentage) ?
      "Not Available" :
      `\n😍 ${roundToTwo(numBuyRatingPercentage)}%, 🥶 ${roundToTwo(numHoldRatingPercentage)}%, 🤬 ${roundToTwo(numSellRatingPercentage)}%`;
    const msg = `*Ticker:* ${tickerText} ${countryFlag} (${country})${marketCapIcon}\n` +
      `*Price:* $${roundToTwo(tradePrice)}\n` +
      `*Market Hours:* $${roundToTwo(todayDiff)} (${roundToTwo(todayPLPercentage)}%)${todayPLIcon}\n` +
      `*After Hours:* $${roundToTwo(todayAfterHourDiff)} (${roundToTwo(todayAfterHourPLPercentage)}%)${todayAfterHourPLIcon}\n` +
      `*Today:* $${roundToTwo(todayFullDayDiff)} (${roundToTwo(todayFullDayPLPercentage)}%)${todayFullDayPLIcon}\n` +
      `*Rating:* ${ratingMsg}\n`;
    return [msg];
  },
  outputValKeys: []
};

// export const displayMessageFirstMentionedStockQuote: MappingFunction = {
//   inputConsts: [],
//   mappingFunction: (inputs: any[], extras: any[]) => {
//     const symbol = inputs[0];
//     const tradePrice = inputs[1];
//     const todayDiff = inputs[2];
//     const todayPLPercentage = inputs[3];
//     const todayPLIcon = getPriceMovementIcon(todayPLPercentage);
//     const todayAfterHourDiff = inputs[4];
//     const todayAfterHourPLPercentage = inputs[5];
//     const todayAfterHourPLIcon = getPriceMovementIcon(todayAfterHourPLPercentage);
//     const todayFullDayDiff = inputs[6];
//     const todayFullDayPLPercentage = inputs[7];
//     const todayFullDayPLIcon = getPriceMovementIcon(todayFullDayPLPercentage);
//     const marketCap = inputs[8];
//     const marketCapIcon = getMarketCapIcon(marketCap);
//     const country = inputs[9];
//     const countryFlag = countryCodeToFlag(country || "US");
//     const numBuyRatingPercentage = inputs[10];
//     const numHoldRatingPercentage = inputs[11];
//     const numSellRatingPercentage = inputs[12];
//     const tickerText = `[${symbol}](https://robinhood.com/stocks/${symbol})`;
//     const ratingMsg = _.isNaN(numBuyRatingPercentage) || _.isNaN(numHoldRatingPercentage) || _.isNaN(numSellRatingPercentage) ?
//       "Not Available" :
//       `\n😍 ${roundToTwo(numBuyRatingPercentage)}%, 🥶 ${roundToTwo(numHoldRatingPercentage)}%, 🤬 ${roundToTwo(numSellRatingPercentage)}%`;
//     const msg = `*Ticker:* ${tickerText} ${countryFlag} (${country})${marketCapIcon}\n` +
//       `*Ticker:* ${tickerText} ${countryFlag} (${country})${marketCapIcon}\n` +
//       `*Price:* $${tradePrice} (${todayFullDayPLPercentage}%)${todayFullDayPLIcon}\n` +
//       `*Mentioned:* ${moment.unix(this.firstMentionedTimestamp).format("YYYY-MM-DD")} ($${this.firstMentionedPrice})\n` +
//       `*P/L Since:* $${this.firstMentionedDiff} (${this.firstMentionedPL}%)${this.firstMentionedIcon}\n` +
//       `*Rating:* ${ratingMsg}\n`;
//     return [msg];
//   },
//   outputValKeys: []
// };

export const displayMessageStockQuoteVsSPY: PostMappingFunction = {
  inputConsts: [],
  mappingFunction: (inputs: any[], extras: any[], allValues: Map<string, (string | number)>[]) => {
    const symbol = inputs[0];
    const tradePrice = inputs[1];
    const ytdPLPercentage = inputs[2];
    const ytdIcon = getPriceMovementIcon(ytdPLPercentage);
    const oneYear = inputs[3];
    const oneYearClosePrice = inputs[4];
    const oneYearPLPercentage = inputs[5];
    const oneYearPLIcon = getPriceMovementIcon(oneYearPLPercentage);
    const twoYear = inputs[6];
    const twoYearClosePrice = inputs[7];
    const twoYearPLPercentage = inputs[8];
    const twoYearPLIcon = getPriceMovementIcon(twoYearPLPercentage);
    const threeYear = inputs[9];
    const threeYearClosePrice = inputs[10];
    const threeYearPLPercentage = inputs[11];
    const threeYearPLIcon = getPriceMovementIcon(threeYearPLPercentage);
    const marketCap = inputs[12];
    const marketCapIcon = getMarketCapIcon(marketCap);
    const country = inputs[13];
    const countryFlag = countryCodeToFlag(country || "US");
    const numBuyRatingPercentage = inputs[14];
    const numHoldRatingPercentage = inputs[15];
    const numSellRatingPercentage = inputs[16];
    const tickerText = `[${symbol}](https://robinhood.com/stocks/${symbol})`;
    const ratingMsg = _.isNaN(numBuyRatingPercentage) || _.isNaN(numHoldRatingPercentage) || _.isNaN(numSellRatingPercentage) ?
      "Not Available" :
      `\n😍 ${roundToTwo(numBuyRatingPercentage)}%, 🥶 ${roundToTwo(numHoldRatingPercentage)}%, 🤬 ${roundToTwo(numSellRatingPercentage)}%`;

    const spy = _.head(allValues.filter((entry) => entry.get("symbol") === "SPY")) || new Map([]);
    const ytdSpy = ytdPLPercentage - (spy.get("ytdPLPercentage") as number);
    const ytdSpyIcon = getPriceMovementIcon(ytdSpy);
    const oneYearSpy = oneYearPLPercentage - (spy.get("oneYearPLPercentage") as number);
    const oneYearSpyIcon = getPriceMovementIcon(oneYearSpy);
    const twoYearSpy = twoYearPLPercentage - (spy.get("twoYearPLPercentage") as number);
    const twoYearSpyIcon = getPriceMovementIcon(twoYearSpy);
    const threeYearSpy = threeYearPLPercentage - (spy.get("threeYearPLPercentage") as number);
    const threeYearSpyIcon = getPriceMovementIcon(threeYearSpy);

    const msg = `*Ticker:* ${tickerText} ${countryFlag} (${country})${marketCapIcon}\n` +
      "*Price (P/L):*\n" +
      ` - *YTD:* $${roundToTwo(tradePrice)} (${roundToTwo(ytdPLPercentage)}%)${ytdIcon}\n` +
      ` - *${oneYear}:* $${roundToTwo(oneYearClosePrice)} (${roundToTwo(oneYearPLPercentage)}%)${oneYearPLIcon}\n` +
      ` - *${twoYear}:* $${roundToTwo(twoYearClosePrice)} (${roundToTwo(twoYearPLPercentage)}%)${twoYearPLIcon}\n` +
      ` - *${threeYear}:* $${roundToTwo(threeYearClosePrice)} (${roundToTwo(threeYearPLPercentage)}%)${threeYearPLIcon}\n` +
      "*Vs SPY:*\n" +
      ` - *YTD:* ${roundToTwo(ytdSpy)}%${ytdSpyIcon}\n` +
      (oneYearPLPercentage === "0.00" ? ` - *${oneYear}:* N/A\n` : ` - *${oneYear}:* ${roundToTwo(oneYearSpy)}%${oneYearSpyIcon}\n`) +
      (twoYearPLPercentage === "0.00" ? ` - *${twoYear}:* N/A\n` : ` - *${twoYear}:* ${roundToTwo(twoYearSpy)}%${twoYearSpyIcon}\n`) +
      (threeYearPLPercentage === "0.00" ? ` - *${threeYear}:* N/A\n` : ` - *${threeYear}:* ${roundToTwo(threeYearSpy)}%${threeYearSpyIcon}\n`) +
      `*Rating:* ${ratingMsg}\n`;
    return [msg];
  },
  outputValKeys: []
};
