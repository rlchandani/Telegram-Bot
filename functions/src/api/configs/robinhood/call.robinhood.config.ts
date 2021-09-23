import _ from "lodash";
import { RobinhoodWrapper } from "../../../helper/robinhood_wrapper";
import { CallConfig } from "../../models/types.integration";
// import { getPriceTargets, getTrendingStocks, getNewsSentimentData } from "tipranks-api-v2";

export const robinhoodGetQuoteCall: CallConfig = {
  apiFunction: async (inputs: Map<string, (string | number)>[], extras: any[]) => {
    const symbols = inputs.map((constMapEntry) => constMapEntry.get("symbol"));
    const credentials = _.head(extras)?.credentials;
    if (_.isEmpty(credentials)) {
      throw new Error("Credentials cannot be empty");
    }
    const RobinhoodWrapperClient = new RobinhoodWrapper(
      credentials.username,
      credentials.password,
      credentials.api_key
    );
    return await RobinhoodWrapperClient.getQuote(symbols).then((response: any) => response.results);
  },
  outputValMappings: [
    {
      const: "symbol",
      keys: ["symbol"]
    },
    {
      const: "lastTradePrice",
      keys: ["last_trade_price"]
    },
    {
      const: "lastExtendedHoursTradePrice",
      keys: ["last_extended_hours_trade_price"]
    },
    {
      const: "previousClose",
      keys: ["previous_close"]
    },
    {
      const: "previousCloseDate",
      keys: ["previous_close_date"]
    },
    {
      const: "instrument",
      keys: ["instrument"]
    },
    {
      const: "instrumentId",
      keys: ["instrument_id"]
    }
  ],
  headers: []
};

export const robinhoodGetInstrumentCall: CallConfig = {
  apiFunction: async (inputs: Map<string, (string | number)>[], extras: any[]) => {
    const promise: Promise<any>[]= [];
    const instruments = inputs.map((constMapEntry) => constMapEntry.get("instrument") as string);
    const credentials = _.head(extras)?.credentials;
    if (_.isEmpty(credentials)) {
      throw new Error("Credentials cannot be empty");
    }
    const RobinhoodWrapperClient = new RobinhoodWrapper(
      credentials.username,
      credentials.password,
      credentials.api_key
    );
    instruments.map((instrument: string) => promise.push(RobinhoodWrapperClient.getUrl(instrument).then((response: any) => response)));
    return await Promise.all(promise);
  },
  outputValMappings: [
    {
      const: "symbol",
      keys: ["symbol"]
    },
    {
      const: "simpleName",
      keys: ["simple_name"]
    },
    {
      const: "name",
      keys: ["name"]
    },
    {
      const: "country",
      keys: ["country"]
    },
    {
      const: "state",
      keys: ["state"]
    }
  ],
  headers: []
};

export const robinhoodGetRatingCall: CallConfig = {
  apiFunction: async (inputs: Map<string, (string | number)>[], extras: any[]) => {
    const promise: Promise<any>[] = [];
    const instrumentIds = inputs.map((constMapEntry) => {
      return {
        "symbol": constMapEntry.get("symbol") as string,
        "instrumentId": constMapEntry.get("instrumentId") as string
      };
    });
    const credentials = _.head(extras)?.credentials;
    if (_.isEmpty(credentials)) {
      throw new Error("Credentials cannot be empty");
    }
    const RobinhoodWrapperClient = new RobinhoodWrapper(
      credentials.username,
      credentials.password,
      credentials.api_key
    );
    instrumentIds.map(({ symbol, instrumentId }) => promise.push(
      RobinhoodWrapperClient.getRatings(instrumentId).then((response: any) => Object.assign(response, { symbol: symbol }))
    ));
    return await Promise.all(promise);
  },
  outputValMappings: [
    {
      const: "symbol",
      keys: ["symbol"]
    },
    {
      const: "numBuyRatings",
      keys: ["summary", "num_buy_ratings"]
    },
    {
      const: "numHoldRatings",
      keys: ["summary", "num_hold_ratings"]
    },
    {
      const: "numSellRatings",
      keys: ["summary", "num_sell_ratings"]
    }
  ],
  headers: []
};

export const robinhoodGetFundamentalCall: CallConfig = {
  apiFunction: async (inputs: Map<string, (string | number)>[], extras: any[]) => {
    const promise: Promise<any>[] = [];
    const symbols = inputs.map((constMapEntry) => constMapEntry.get("symbol"));
    const credentials = _.head(extras)?.credentials;
    if (_.isEmpty(credentials)) {
      throw new Error("Credentials cannot be empty");
    }
    const RobinhoodWrapperClient = new RobinhoodWrapper(
      credentials.username,
      credentials.password,
      credentials.api_key
    );
    symbols.forEach((symbol) => promise.push(RobinhoodWrapperClient.getFundamentals(symbol as string)
      .then((response: any) => Object.assign(response, { symbol: symbol }))));
    return await Promise.all(promise);
  },
  outputValMappings: [
    {
      const: "symbol",
      keys: ["symbol"]
    },
    {
      const: "sector",
      keys: ["sector"]
    },
    {
      const: "industry",
      keys: ["industry"]
    },
    {
      const: "marketCap",
      keys: ["market_cap"]
    },
    {
      const: "low52Weeks",
      keys: ["low_52_weeks"]
    },
    {
      const: "high52Weeks",
      keys: ["high_52_weeks"]
    },
    {
      const: "peRatio",
      keys: ["pe_ratio"]
    },
    {
      const: "pbRatio",
      keys: ["pb_ratio"]
    },
    {
      const: "dividendYield",
      keys: ["dividend_yield"]
    }
  ],
  headers: []
};

export const robinhoodGetHistoricalCall: CallConfig = {
  apiFunction: async (inputs: Map<string, (string | number)>[], extras: any[]) => {
    const symbols = inputs.map((constMapEntry) => constMapEntry.get("symbol"));
    const credentials = _.head(extras)?.credentials;
    if (_.isEmpty(credentials)) {
      throw new Error("Credentials cannot be empty");
    }
    const RobinhoodWrapperClient = new RobinhoodWrapper(
      credentials.username,
      credentials.password,
      credentials.api_key
    );
    return await RobinhoodWrapperClient.getHistoricals(symbols).then((response: any) => response.results);
  },
  outputValMappings: [
    {
      const: "symbol",
      keys: ["symbol"]
    },
    {
      const: "historicals",
      keys: ["historicals"]
    }
  ],
  headers: []
};

// export const tipRanksGetPriceTarget: CallConfig = {
//   apiFunction: async (inputs: Map<string, (string | number)>[], extras: any[]) => {
//     const promise: Promise<any>[] = [];
//     const dummyPromise: Promise<any>[] = [];
//     const symbols = inputs.map((constMapEntry) => constMapEntry.get("symbol"));
//     // await getTrendingStocks().then((trending: any) => console.log(trending));
//     await getNewsSentimentData("AAPL").then((trending: any) => console.log(trending));
//     symbols.forEach((symbol) => {
//       console.log("Calling TipRanks API for Symbol:", symbol);
//       // promise.push(getPriceTargets(symbol as string)
//       //   .then((response: any) => Object.assign(response, { symbol: symbol })));
//     });
//     return await Promise.all(promise);
//   },
//   outputValMappings: [
//     {
//       const: "symbol",
//       keys: ["symbol"]
//     },
//     {
//       const: "mean",
//       keys: ["priceTargets", "mean"]
//     }
//   ],
//   headers: []
// };
