/* eslint-disable require-jsdoc */
// import { roundToTwo, getPriceMovementIcon, getLastTradedPrice } from "../helper/utils";
// import moment from "moment-timezone";
// import { Builder } from "builder-pattern";
const twoDecimalPlaces = (value: number): number => Math.round(value * 100) / 100;

interface IStockQuote {
  symbol?: string;
  lastTradePrice?: number;
  lastExtendedHoursTradePrice?: number;
  previousClose?: number;
  country?: string;
  countryFlag?: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  high52Week?: number;
  low52Week?: number;
  threeYearPL?: number;
  threeYearPLPercentage?: number;
  threeYearOldClosePrice?: number;
  twoYearPL?: number;
  twoYearPLPercentage?: number;
  twoYearOldClosePrice?: number;
  oneYearPL?: number;
  oneYearPLPercentage?: number;
  oneYearOldClosePrice?: number;
  ytd?: number;
  ytdPercentage?: number;
  ytdSpy?: number;
  oneYearSpy?: number;
  twoYearSpy?: number;
  threeYearSpy?: number;
}

// // eslint-disable-next-line new-cap
// const userInfo = Builder<StockQuote>().symbol("as").build();
// console.log(userInfo.threeYearSpy);

class StockQuote implements IStockQuote {
  constructor(stockQuote: IStockQuote) {
    console.log(stockQuote);
    console.log(this);
    Object.assign(this, stockQuote);
  }

  get symbol(): string {
    return this.symbol;
  }

  get lastTradePrice(): number {
    return this.lastTradePrice;
  }
  get lastExtendedHoursTradePrice(): number {
    return this.lastExtendedHoursTradePrice;
  }
  get previousClose(): number {
    return this.previousClose;
  }
  get country(): string {
    return this.country;
  }
  get countryFlag(): string {
    return this.countryFlag;
  }
  get sector(): string {
    return this.sector;
  }
  get industry(): string {
    return this.industry;
  }
  get marketCap(): number {
    return this.marketCap;
  }
  get high52Week(): number {
    return this.high52Week;
  }
  get low52Week(): number {
    return this.low52Week;
  }
  get threeYearPL(): number {
    return this.threeYearPL;
  }
  get threeYearPLPercentage(): number {
    return this.threeYearPLPercentage;
  }
  get threeYearOldClosePrice(): number {
    return this.threeYearOldClosePrice;
  }
  get twoYearPL(): number {
    return this.twoYearPL;
  }
  get twoYearPLPercentage(): number {
    return this.twoYearPLPercentage;
  }
  get twoYearOldClosePrice(): number {
    return this.twoYearOldClosePrice;
  }
  get oneYearPL(): number {
    return this.oneYearPL;
  }
  get oneYearPLPercentage(): number {
    return this.oneYearPLPercentage;
  }
  get oneYearOldClosePrice(): number {
    return this.oneYearOldClosePrice;
  }
  get ytd(): number {
    return this.ytd;
  }
  get ytdPercentage(): number {
    return this.ytdPercentage;
  }
  get ytdSpy(): number {
    return this.ytdSpy;
  }
  get oneYearSpy(): number {
    return this.oneYearSpy;
  }
  get twoYearSpy(): number {
    return this.twoYearSpy;
  }
  get threeYearSpy(): number {
    return this.threeYearSpy;
  }

  get getFirstMentionedQuoteMessage(): string {
    return "";
  }

  get getStockQuoteMessage(): string {
    return "";
  }

  get getVsSPYQuoteMessage(): string {
    return "";
  }

  get toString(): string {
    return JSON.stringify(this);
  }

  get toJson(): StockQuote {
    return JSON.parse(JSON.stringify(this));
  }
}

class StockQuoteBuilder implements Partial<IStockQuote> {
  symbol: string;

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  // withSymbol(value: string): this & Pick<StockQuote, 'symbol'> {
  //   return Object.assign(this, { symbol: value });
  // }

  withLastTradePrice(value: number): this & Pick<StockQuote, "lastTradePrice"> {
    return Object.assign(this, { lastTradePrice: twoDecimalPlaces(value) });
  }
  withLastExtendedHoursTradePrice(value: number): this & Pick<StockQuote, "lastExtendedHoursTradePrice"> {
    return Object.assign(this, { lastExtendedHoursTradePrice: twoDecimalPlaces(value) });
  }
  withPreviousClose(value: number): this & Pick<StockQuote, "previousClose"> {
    return Object.assign(this, { previousClose: twoDecimalPlaces(value) });
  }
  withCountry(value: string): this & Pick<StockQuote, "country"> {
    return Object.assign(this, { country: value });
  }
  withCountryFlag(value: string): this & Pick<StockQuote, "countryFlag"> {
    return Object.assign(this, { countryFlag: value });
  }
  withSector(value: string): this & Pick<StockQuote, "sector"> {
    return Object.assign(this, { sector: value });
  }
  withIndustry(value: string): this & Pick<StockQuote, "industry"> {
    return Object.assign(this, { industry: value });
  }
  withMarketCap(value: number): this & Pick<StockQuote, "marketCap"> {
    return Object.assign(this, { marketCap: twoDecimalPlaces(value) });
  }
  withHigh52Week(value: number): this & Pick<StockQuote, "high52Week"> {
    return Object.assign(this, { high52Week: twoDecimalPlaces(value) });
  }
  withLow52Week(value: number): this & Pick<StockQuote, "low52Week"> {
    return Object.assign(this, { low52Week: twoDecimalPlaces(value) });
  }
  withThreeYearPL(value: number): this & Pick<StockQuote, "threeYearPL"> {
    return Object.assign(this, { threeYearPL: twoDecimalPlaces(value) });
  }
  withThreeYearPLPercentage(value: number): this & Pick<StockQuote, "threeYearPLPercentage"> {
    return Object.assign(this, { threeYearPLPercentage: twoDecimalPlaces(value) });
  }
  withThreeYearOldClosePrice(value: number): this & Pick<StockQuote, "threeYearOldClosePrice"> {
    return Object.assign(this, { threeYearOldClosePrice: twoDecimalPlaces(value) });
  }
  withTwoYearPL(value: number): this & Pick<StockQuote, "twoYearPL"> {
    return Object.assign(this, { twoYearPL: twoDecimalPlaces(value) });
  }
  withTwoYearPLPercentage(value: number): this & Pick<StockQuote, "twoYearPLPercentage"> {
    return Object.assign(this, { twoYearPLPercentage: twoDecimalPlaces(value) });
  }
  withTwoYearOldClosePrice(value: number): this & Pick<StockQuote, "twoYearOldClosePrice"> {
    return Object.assign(this, { twoYearOldClosePrice: twoDecimalPlaces(value) });
  }
  withOneYearPL(value: number): this & Pick<StockQuote, "oneYearPL"> {
    return Object.assign(this, { oneYearPL: twoDecimalPlaces(value) });
  }
  withOneYearPLPercentage(value: number): this & Pick<StockQuote, "oneYearPLPercentage"> {
    return Object.assign(this, { oneYearPLPercentage: twoDecimalPlaces(value) });
  }
  withOneYearOldClosePrice(value: number): this & Pick<StockQuote, "oneYearOldClosePrice"> {
    return Object.assign(this, { oneYearOldClosePrice: twoDecimalPlaces(value) });
  }
  withYtd(value: number): this & Pick<StockQuote, "ytd"> {
    return Object.assign(this, { ytd: twoDecimalPlaces(value) });
  }
  withYtdPercentage(value: number): this & Pick<StockQuote, "ytdPercentage"> {
    return Object.assign(this, { ytdPercentage: twoDecimalPlaces(value) });
  }
  withYtdSpy(value: number): this & Pick<StockQuote, "ytdSpy"> {
    return Object.assign(this, { ytdSpy: twoDecimalPlaces(value) });
  }
  withOneYearSpy(value: number): this & Pick<StockQuote, "oneYearSpy"> {
    return Object.assign(this, { oneYearSpy: twoDecimalPlaces(value) });
  }
  withTwoYearSpy(value: number): this & Pick<StockQuote, "twoYearSpy"> {
    return Object.assign(this, { twoYearSpy: twoDecimalPlaces(value) });
  }
  withThreeYearSpy(value: number): this & Pick<StockQuote, "threeYearSpy"> {
    return Object.assign(this, { threeYearSpy: twoDecimalPlaces(value) });
  }

  build() {
    return new StockQuote(this);
  }
}

export { StockQuote, StockQuoteBuilder };
