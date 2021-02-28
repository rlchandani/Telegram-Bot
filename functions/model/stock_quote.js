/* eslint-disable require-jsdoc */
const { roundToTwo, getPriceMovementIcon, getLastTradedPrice } = require("../helper/utils");
const moment = require("moment-timezone");

class StockQuote {
  constructor(symbol, lastTradePrice, lastExtendedHoursTradePrice, previousClose, country, countryFlag, sector) {
    this.symbol = symbol.toUpperCase();
    this.tickerText = `[${this.symbol}](https://robinhood.com/stocks/${this.symbol})`;

    this.lastTradePrice = roundToTwo(lastTradePrice);
    this.lastExtendedHoursTradePrice = roundToTwo(lastExtendedHoursTradePrice);
    this.tradePrice = getLastTradedPrice(lastTradePrice, lastExtendedHoursTradePrice);

    this.previousClose = roundToTwo(previousClose);

    this.todayDiff = roundToTwo(lastTradePrice - previousClose);
    this.todayPL = roundToTwo((this.todayDiff * 100) / previousClose);
    this.todayIcon = getPriceMovementIcon(this.todayPL);

    this.todayAfterHourDiff = roundToTwo(lastExtendedHoursTradePrice - lastTradePrice);
    this.todayAfterHourPL = roundToTwo((this.todayAfterHourDiff * 100) / lastTradePrice);
    this.todayAfterHourIcon = getPriceMovementIcon(this.todayAfterHourPL);

    this.todayFullDayDiff = roundToTwo(this.tradePrice - previousClose);
    this.todayFullDayPL = roundToTwo((this.todayFullDayDiff * 100) / previousClose);
    this.todayFullDayIcon = getPriceMovementIcon(this.todayFullDayPL);

    this.country = country.toUpperCase();
    this.countryFlag = countryFlag;

    this.sector = sector;
  }

  getSymbol = () => this.symbol;
  getTradePrice = () => this.tradePrice;
  getLastTradedPrice = () => this.lastTradePrice;
  getLastExtendedHoursTradePrice = () => this.lastExtendedHoursTradePrice;
  getPreviousClose = () => this.previousClose;
  getCountry = () => this.country;
  getCountryFlag = () => this.countryFlag;
  getSector = () => this.sector;

  setFirstMentioned = (firstMentionedPrice, firstMentionedTimestamp) => {
    this.firstMentionedPrice = roundToTwo(firstMentionedPrice);
    this.firstMentionedTimestamp = firstMentionedTimestamp;
    this.firstMentionedDiff = roundToTwo(this.tradePrice - this.firstMentionedPrice);
    this.firstMentionedPL = roundToTwo((this.firstMentionedDiff * 100) / this.firstMentionedPrice);
    this.firstMentionedIcon = getPriceMovementIcon(this.firstMentionedPL);
    return this;
  };

  getFirstMentionedQuoteMessage = () => {
    return (
      `*Ticker:* ${this.tickerText} ${this.countryFlag} (${this.country})\n` +
      `*Price:* $${this.tradePrice} (${this.todayFullDayPL}%) ${this.todayFullDayIcon}\n` +
      `*First Mentioned:* ${moment.unix(this.firstMentionedTimestamp).format("YYYY-MM-DD")} ($${this.firstMentionedPrice})\n` +
      `*P/L Since:* $${this.firstMentionedDiff} (${this.firstMentionedPL}%) ${this.firstMentionedIcon}\n`
    );
  };

  getStockQuoteMessage = () => {
    return (
      `*Ticker:* ${this.tickerText} ${this.countryFlag} (${this.country})\n` +
      `*Price:* $${this.tradePrice} (${this.todayFullDayPL}%) ${this.todayFullDayIcon}\n` +
      `*Today:* $${this.todayDiff} (${this.todayPL}%) ${this.todayIcon}\n` +
      `*After Hours:* $${this.todayAfterHourDiff} (${this.todayAfterHourPL}%) ${this.todayAfterHourIcon}\n\n`
      // `*Sector:* ${this.sector}\n\n`
      // `*Total P/L:* $${total} (${totalPL}%)`
    );
  };

  toString = () => {
    return JSON.stringify(this);
  };

  toJson = () => {
    return JSON.parse(JSON.stringify(this));
  };
}

class StockQuoteBuilder {
  constructor(symbol) {
    this.symbol = symbol;
  }

  setLastTradePrice = (lastTradePrice) => {
    this.lastTradePrice = lastTradePrice;
    return this;
  };

  setExtendedHourTradePrice = (lastExtendedHoursTradePrice) => {
    this.lastExtendedHoursTradePrice = lastExtendedHoursTradePrice;
    return this;
  };

  setPreviousClose = (previousClose) => {
    this.previousClose = previousClose;
    return this;
  };

  setCountry = (country) => {
    this.country = country;
    return this;
  };

  setCountryFlag = (countryFlag) => {
    this.countryFlag = countryFlag;
    return this;
  };

  setSector = (sector) => {
    this.sector = sector;
    return this;
  };

  build = () => {
    return new StockQuote(
      this.symbol,
      this.lastTradePrice,
      this.lastExtendedHoursTradePrice,
      this.previousClose,
      this.country,
      this.countryFlag,
      this.sector
    );
  };
}

module.exports = {
  StockQuoteBuilder,
};
