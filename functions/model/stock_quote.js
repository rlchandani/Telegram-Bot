/* eslint-disable require-jsdoc */
const { roundToTwo, getPriceMovementIcon, getLastTradedPrice } = require("../helper/utils");
const moment = require("moment-timezone");

class StockQuote {
  constructor(
    symbol,
    lastTradePrice,
    lastExtendedHoursTradePrice,
    previousClose,
    country,
    countryFlag,
    sector,
    industry,
    marketCap,
    high52Week,
    low52Week
  ) {
    this.symbol = symbol.toUpperCase();
    this.tickerText = `[${this.symbol}](https://robinhood.com/stocks/${this.symbol})`;

    this.lastTradePrice = roundToTwo(lastTradePrice);
    this.lastExtendedHoursTradePrice = roundToTwo(lastExtendedHoursTradePrice);
    this._tradePrice = getLastTradedPrice(lastTradePrice, lastExtendedHoursTradePrice); // Bugfix: Handle tradePrice > $1000
    this.tradePrice = roundToTwo(this._tradePrice);

    this.previousClose = roundToTwo(previousClose);

    this.todayDiff = roundToTwo(lastTradePrice - previousClose);
    this.todayPL = roundToTwo((this.todayDiff * 100) / previousClose);
    this.todayIcon = getPriceMovementIcon(this.todayPL);

    this.todayAfterHourDiff = roundToTwo(this._tradePrice - lastTradePrice);
    this.todayAfterHourPL = roundToTwo((this.todayAfterHourDiff * 100) / lastTradePrice);
    this.todayAfterHourIcon = getPriceMovementIcon(this.todayAfterHourPL);

    this.todayFullDayDiff = roundToTwo(this._tradePrice - previousClose);
    this.todayFullDayPL = roundToTwo((this.todayFullDayDiff * 100) / previousClose);
    this.todayFullDayIcon = getPriceMovementIcon(this.todayFullDayPL);

    this.country = country.toUpperCase();
    this.countryFlag = countryFlag;

    this.sector = sector;
    this.industry = industry;
    this.marketCap = marketCap;
    this.high52Week = high52Week;
    this.low52Week = low52Week;

    if (marketCap > 250000000 && marketCap < 2000000000) {
      this.marketCapSize = "Small-Cap";
      this.marketCapIcon = "🥉";
    } else if (marketCap > 2000000000 && marketCap < 10000000000) {
      this.marketCapSize = "Mid-Cap";
      this.marketCapIcon = "🥈";
    } else if (marketCap > 10000000000) {
      this.marketCapSize = "Large-Cap";
      this.marketCapIcon = "🥇";
    } else {
      this.marketCapSize = "Tiny-Cap";
      this.marketCapIcon = "🥉🥉";
    }
  }

  getSymbol = () => this.symbol;
  getTradePrice = () => this.tradePrice;
  getLastTradedPrice = () => this.lastTradePrice;
  getLastExtendedHoursTradePrice = () => this.lastExtendedHoursTradePrice;
  getPreviousClose = () => this.previousClose;
  getCountry = () => this.country;
  getCountryFlag = () => this.countryFlag;
  getSector = () => this.sector;
  getIndustry = () => this.industry;
  getMarketCap = () => this.marketCap;
  getMarketCapSize = () => this.marketCapSize;
  getMarketCapIcon = () => this.marketCapIcon;
  getHigh52Week = () => this.high52Week;
  getLow52Week = () => this.low52Week;

  setFirstMentioned = (firstMentionedPrice, firstMentionedTimestamp) => {
    this.firstMentionedPrice = roundToTwo(firstMentionedPrice);
    this.firstMentionedTimestamp = firstMentionedTimestamp;
    this.firstMentionedDiff = roundToTwo(this._tradePrice - this.firstMentionedPrice);
    this.firstMentionedPL = roundToTwo((this.firstMentionedDiff * 100) / this.firstMentionedPrice);
    this.firstMentionedIcon = getPriceMovementIcon(this.firstMentionedPL);
    return this;
  };

  setMentionedCount = (count) => {
    this.mentionedCount = count;
    return this;
  };

  getFirstMentionedQuoteMessage = () => {
    return (
      `*Ticker:* ${this.tickerText} ${this.countryFlag} (${this.country})${this.marketCapIcon}\n` +
      `*Price:* $${this.tradePrice} (${this.todayFullDayPL}%)${this.todayFullDayIcon}\n` +
      `*Mentioned:* ${moment.unix(this.firstMentionedTimestamp).format("YYYY-MM-DD")} ($${this.firstMentionedPrice})\n` +
      `*P/L Since:* $${this.firstMentionedDiff} (${this.firstMentionedPL}%)${this.firstMentionedIcon}\n`
    );
  };

  getStockQuoteMessage = () => {
    return (
      `*Ticker:* ${this.tickerText} ${this.countryFlag} (${this.country})${this.marketCapIcon}\n` +
      `*Price:* $${this.tradePrice} (${this.todayFullDayPL}%)${this.todayFullDayIcon}\n` +
      `*Today:* $${this.todayDiff} (${this.todayPL}%)${this.todayIcon}\n` +
      `*After Hours:* $${this.todayAfterHourDiff} (${this.todayAfterHourPL}%)${this.todayAfterHourIcon}\n`
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

  setIndustry = (industry) => {
    this.industry = industry;
    return this;
  };

  setMarketCap = (marketCap) => {
    this.marketCap = marketCap;
    return this;
  };

  setHigh52Week = (high52Week) => {
    this.high52Week = high52Week;
    return this;
  };

  setLow52Week = (low52Week) => {
    this.low52Week = low52Week;
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
      this.sector,
      this.industry,
      this.marketCap,
      this.high52Week,
      this.low52Week
    );
  };
}

module.exports = {
  StockQuoteBuilder,
};
