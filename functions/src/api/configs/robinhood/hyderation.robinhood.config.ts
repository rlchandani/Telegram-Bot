import { Config } from "../../models/types.hydration";
import {
  robinhoodGetFundamentalCall,
  robinhoodGetHistoricalCall,
  robinhoodGetInstrumentCall,
  robinhoodGetQuoteCall,
  robinhoodGetRatingCall
} from "./call.robinhood.config";
import {
  coalesce,
  displayMessageStockQuote,
  displayMessageStockQuoteVsSPY,
  pAndLDaily,
  pAndLYearly,
  processStockRating
} from "./functions.robinhood";

export const robinhoodHydrationConfig: Config = {
  resourceIdentifier: {
    externalSystem: "Robinhood",
    key: "symbol"
  },
  callConfigs: [robinhoodGetQuoteCall, robinhoodGetInstrumentCall, robinhoodGetFundamentalCall, robinhoodGetRatingCall, robinhoodGetHistoricalCall],
  mappingFunctions: [
    {
      inputConsts: ["lastExtendedHoursTradePrice", "lastTradePrice"],
      mappingFunction: coalesce.mappingFunction,
      outputValKeys: ["lastExtendedHoursTradePrice"]
    },
    {
      inputConsts: ["lastExtendedHoursTradePrice", "lastTradePrice"],
      mappingFunction: coalesce.mappingFunction,
      outputValKeys: ["tradePrice"]
    },
    {
      inputConsts: ["tradePrice", "lastTradePrice", "lastExtendedHoursTradePrice", "previousClose"],
      mappingFunction: pAndLDaily.mappingFunction,
      outputValKeys: [
        "todayDiff",
        "todayPLPercentage",
        "todayAfterHourDiff",
        "todayAfterHourPLPercentage",
        "todayFullDayDiff",
        "todayFullDayPLPercentage"
      ]
    },
    {
      inputConsts: ["historicals"],
      extras: [
        {
          previousYear: 1,
          currentYear: 0
        }
      ],
      mappingFunction: pAndLYearly.mappingFunction,
      outputValKeys: ["ytdYear", "ytdClosePrice", "ytdPL", "ytdPLPercentage"]
    },
    {
      inputConsts: ["historicals"],
      extras: [
        {
          previousYear: 2,
          currentYear: 1
        }
      ],
      mappingFunction: pAndLYearly.mappingFunction,
      outputValKeys: ["oneYear", "oneYearClosePrice", "oneYearPL", "oneYearPLPercentage"]
    },
    {
      inputConsts: ["historicals"],
      extras: [
        {
          previousYear: 3,
          currentYear: 2
        }
      ],
      mappingFunction: pAndLYearly.mappingFunction,
      outputValKeys: ["twoYear", "twoYearClosePrice", "twoYearPL", "twoYearPLPercentage"]
    },
    {
      inputConsts: ["historicals"],
      extras: [
        {
          previousYear: 4,
          currentYear: 3
        }
      ],
      mappingFunction: pAndLYearly.mappingFunction,
      outputValKeys: ["threeYear", "threeYearClosePrice", "threeYearPL", "threeYearPLPercentage"]
    },
    {
      inputConsts: ["numBuyRatings", "numHoldRatings", "numSellRatings"],
      mappingFunction: processStockRating.mappingFunction,
      outputValKeys: ["numBuyRatingPercentage", "numHoldRatingPercentage", "numSellRatingPercentage"]
    },
    {
      inputConsts: [
        "symbol",
        "tradePrice",
        "todayDiff",
        "todayPLPercentage",
        "todayAfterHourDiff",
        "todayAfterHourPLPercentage",
        "todayFullDayDiff",
        "todayFullDayPLPercentage",
        "marketCap",
        "country",
        "numBuyRatingPercentage",
        "numHoldRatingPercentage",
        "numSellRatingPercentage"
      ],
      mappingFunction: displayMessageStockQuote.mappingFunction,
      outputValKeys: ["displayMessageStockQuote"]
    }
  ],
  postMappingFunctions: [
    {
      inputConsts: [
        "symbol",
        "tradePrice",
        "ytdPLPercentage",
        "oneYear",
        "oneYearClosePrice",
        "oneYearPLPercentage",
        "twoYear",
        "twoYearClosePrice",
        "twoYearPLPercentage",
        "threeYear",
        "threeYearClosePrice",
        "threeYearPLPercentage",
        "marketCap",
        "country",
        "numBuyRatingPercentage",
        "numHoldRatingPercentage",
        "numSellRatingPercentage"
      ],
      mappingFunction: displayMessageStockQuoteVsSPY.mappingFunction,
      outputValKeys: ["displayMessageStockQuoteVsSPY"]
    }
  ],
  displayConfig: {
    displayName: "symbol",
    displayValues: [
      {
        displayName: "Last Traded Price",
        constName: "lastTradePrice"
      },
      {
        displayName: "Extended Last Traded Price",
        constName: "lastExtendedHoursTradePrice"
      },
      {
        displayName: "Previous Close",
        constName: "previousClose"
      },
      {
        displayName: "Previous Close Date",
        constName: "previousCloseDate"
      },
      {
        displayName: "Mapped Value",
        constName: "tradePrice"
      },
      {
        displayName: "Display Msg Stock Quote",
        constName: "displayMessageStockQuote"
      },
      {
        displayName: "Display Msg Stock Quote vs SPY",
        constName: "displayMessageStockQuoteVsSPY"
      }
    ],
    externalLink: "https://robinhood.com/stocks/{symbol}",
    appendix: [
      "symbol",
      "simpleName",
      "name",
      "tradePrice",
      "lastTradePrice",
      "lastExtendedHoursTradePrice",
      //   "previousClose",
      //   "previousCloseDate",
      //   "instrument",
      "todayPLPercentage",
      "country",
      "displayMessageStockQuote",
      "displayMessageStockQuoteVsSPY"
    //   "state",
    //   "sector",
    //   "industry",
    //   "marketCap",
    //   "low52Weeks",
    //   "high52Weeks",
    //   "peRatio",
    //   "pbRatio",
    //   "dividendYield",
    //   // "historicals",
    //   "ytdClosePrice",
    //   "ytdPL",
    //   "ytdPLPercentage",
    //   "oneYearClosePrice",
    //   "oneYearPL",
    //   "oneYearPLPercentage",
    //   "twoYearClosePrice",
    //   "twoYearPL",
    //   "twoYearPLPercentage",
    //   "threeYearClosePrice",
    //   "threeYearPL",
    //   "threeYearPLPercentage"
    ]
  }
};
