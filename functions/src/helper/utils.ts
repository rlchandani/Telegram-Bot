import { logger } from "firebase-functions";
import moment from "moment-timezone";
import _ from "lodash";

export const extractTickerSymbolsInsideMessageText = (message: any) => {
  if (_.isEmpty(message)) {
    return [];
  }
  const re = /[\s!%^&*()_,></?;:'".=+\-\\]*(\$[a-zA-Z]+)/g;
  const matches = Array.from(message.matchAll(re)).map((match: any) => match[1]);
  return matches ? [...new Set(matches.map((m) => m.replace(/(\$+)/g, "").toUpperCase()))] : [];
};

export const extractTickerSymbolsFromQuoteCommand = (message: any) => {
  if (_.isEmpty(message)) {
    return [];
  }
  const re = /[\s$]+(\w+)/g;
  const matches = Array.from(message.matchAll(re)).map((match: any) => match[1]);
  return matches ? [...new Set(matches.map((m) => m.replace(/(\$+)/g, "").toUpperCase()))] : [];
};

export const extractCashTag = (message: any, entities: any) => {
  if (_.isEmpty(message) || _.isEmpty(entities)) {
    return [];
  }
  return entities
    .map((item: any) => {
      if (item.type === "cashtag") {
        return message.substring(item.offset + 1, item.offset + item.length);
      }
    })
    .filter((item: any) => item !== undefined && item !== null);
};

export const extractHashTag = (message: any, entities: any) => {
  if (_.isEmpty(message) || _.isEmpty(entities)) {
    return [];
  }
  return entities
    .map((item: any) => {
      if (item.type === "hashtag") {
        return message.substring(item.offset + 1, item.offset + item.length);
      }
    })
    .filter((item: any) => item !== undefined && item !== null);
};

export const getPriceMovementIcon = (price: any) => {
  if (price < 0) {
    return "💔";
  }
  if (price > 0) {
    return "💚";
  }
  return "";
};

export const isMarketOpenToday = async (RobinhoodWrapperClient: any) => {
  logger.info("isMarketOpenToday: Checking if market is open today");
  const marketsResponse = await RobinhoodWrapperClient.getMarkets();
  const markets = marketsResponse.results;
  const urls = markets.map((market: any) => market.url + "hours/" + moment().tz("America/Los_Angeles").format("YYYY-MM-DD"));
  const isMarketOpen = urls.map((url: any) => RobinhoodWrapperClient.getUrl(url));
  return Promise.all(isMarketOpen).then((values) => {
    return values.filter((v: any) => v.is_open === true).length > 0;
  });
};

export const roundToTwo = (num: number) => {
  // return (+(Math.round(num + "e+2") + "e-2")).toLocaleString("en", {
  //   minimumFractionDigits: 2,
  //   maximumFractionDigits: 2,
  // });
  const places = 2;
  const factor = 10 ** places;
  return (Math.round(num * factor) / factor).toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const getLastTradedPrice = (lastTradedPrice: any, lastExtendedHourTradedPrice: any) => {
  if (lastExtendedHourTradedPrice > 0) {
    return lastExtendedHourTradedPrice;
  }
  return lastTradedPrice;
};
