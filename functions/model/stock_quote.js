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
    low52Week,
    threeYearPL,
    threeYearPLPercentage,
    threeYearOldClosePrice,
    twoYearPL,
    twoYearPLPercentage,
    twoYearOldClosePrice,
    oneYearPL,
    oneYearPLPercentage,
    oneYearOldClosePrice,
    ytd,
    ytdPercentage,
    ytdSpy,
    oneYearSpy,
    twoYearSpy,
    threeYearSpy
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
    this.threeYearPL = roundToTwo(threeYearPL);
    this.threeYearPLPercentage = roundToTwo(threeYearPLPercentage);
    this.threeYearPLIcon = getPriceMovementIcon(threeYearPLPercentage);
    this.twoYearPL = roundToTwo(twoYearPL);
    this.twoYearPLPercentage = roundToTwo(twoYearPLPercentage);
    this.twoYearPLIcon = getPriceMovementIcon(twoYearPLPercentage);
    this.oneYearPL = roundToTwo(oneYearPL);
    this.oneYearPLPercentage = roundToTwo(oneYearPLPercentage);
    this.oneYearPLIcon = getPriceMovementIcon(oneYearPLPercentage);
    this.ytd = roundToTwo(ytd);
    this.ytdPercentage = roundToTwo(ytdPercentage);
    this.ytdIcon = getPriceMovementIcon(ytdPercentage);
    this.ytdSpy = roundToTwo(ytdSpy);
    this.ytdSpyIcon = getPriceMovementIcon(ytdSpy);
    this.oneYearOldClosePrice = roundToTwo(oneYearOldClosePrice);
    this.oneYearSpy = roundToTwo(oneYearSpy);
    this.oneYearSpyIcon = getPriceMovementIcon(oneYearSpy);
    this.twoYearOldClosePrice = roundToTwo(twoYearOldClosePrice);
    this.twoYearSpy = roundToTwo(twoYearSpy);
    this.twoYearSpyIcon = getPriceMovementIcon(twoYearSpy);
    this.threeYearOldClosePrice = roundToTwo(threeYearOldClosePrice);
    this.threeYearSpy = roundToTwo(threeYearSpy);
    this.threeYearSpyIcon = getPriceMovementIcon(threeYearSpy);

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

  getVsSPYQuoteMessage = () => {
    const oneYear = moment().tz("America/Los_Angeles").subtract(1, "years").format("YYYY");
    const twoYear = moment().tz("America/Los_Angeles").subtract(2, "years").format("YYYY");
    const threeYear = moment().tz("America/Los_Angeles").subtract(3, "years").format("YYYY");
    return (
      `*Ticker:* ${this.tickerText} ${this.countryFlag} (${this.country})${this.marketCapIcon}\n` +
      "*Price (P/L):*\n" +
      ` - *YTD:* $${this.tradePrice} (${this.ytdPercentage}%)${this.ytdIcon}\n` +
      ` - *${oneYear}:* $${this.oneYearOldClosePrice} (${this.oneYearPLPercentage}%)${this.oneYearPLIcon}\n` +
      ` - *${twoYear}:* $${this.twoYearOldClosePrice} (${this.twoYearPLPercentage}%)${this.twoYearPLIcon}\n` +
      ` - *${threeYear}:* $${this.threeYearOldClosePrice} (${this.threeYearPLPercentage}%)${this.threeYearPLIcon}\n` +
      "*Vs SPY:*\n" +
      ` - *YTD:* ${this.ytdSpy}%${this.ytdSpyIcon}\n` +
      (this.oneYearPLPercentage === "0.00" ? ` - *${oneYear}:* N/A\n` : ` - *${oneYear}:* ${this.oneYearSpy}%${this.oneYearSpyIcon}\n`) +
      (this.twoYearPLPercentage === "0.00" ? ` - *${twoYear}:* N/A\n` : ` - *${twoYear}:* ${this.twoYearSpy}%${this.twoYearSpyIcon}\n`) +
      (this.threeYearPLPercentage === "0.00" ? ` - *${threeYear}:* N/A\n` : ` - *${threeYear}:* ${this.threeYearSpy}%${this.threeYearSpyIcon}\n`)
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

  setYtd = (ytd) => {
    this.ytd = ytd;
    return this;
  };

  setYtdPercentage = (ytdPercentage) => {
    this.ytdPercentage = ytdPercentage;
    return this;
  };

  setOneYearOldClosePrice = (oneYearOldClosePrice) => {
    this.oneYearOldClosePrice = oneYearOldClosePrice;
    return this;
  };

  setOneYearPL = (oneYearPL) => {
    this.oneYearPL = oneYearPL;
    return this;
  };

  setOneYearPLPercentage = (oneYearPLPercentage) => {
    this.oneYearPLPercentage = oneYearPLPercentage;
    return this;
  };

  setTwoYearOldClosePrice = (twoYearOldClosePrice) => {
    this.twoYearOldClosePrice = twoYearOldClosePrice;
    return this;
  };

  setTwoYearPL = (twoYearPL) => {
    this.twoYearPL = twoYearPL;
    return this;
  };

  setTwoYearPLPercentage = (twoYearPLPercentage) => {
    this.twoYearPLPercentage = twoYearPLPercentage;
    return this;
  };

  setThreeYearOldClosePrice = (threeYearOldClosePrice) => {
    this.threeYearOldClosePrice = threeYearOldClosePrice;
    return this;
  };

  setThreeYearPL = (threeYearPL) => {
    this.threeYearPL = threeYearPL;
    return this;
  };

  setThreeYearPLPercentage = (threeYearPLPercentage) => {
    this.threeYearPLPercentage = threeYearPLPercentage;
    return this;
  };

  setYtdSpy = (ytdSpy) => {
    this.ytdSpy = ytdSpy;
    return this;
  };

  setOneYearSpy = (oneYearSpy) => {
    this.oneYearSpy = oneYearSpy;
    return this;
  };

  setTwoYearSpy = (twoYearSpy) => {
    this.twoYearSpy = twoYearSpy;
    return this;
  };

  setThreeYearSpy = (threeYearSpy) => {
    this.threeYearSpy = threeYearSpy;
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
      this.low52Week,
      this.threeYearPL,
      this.threeYearPLPercentage,
      this.threeYearOldClosePrice,
      this.twoYearPL,
      this.twoYearPLPercentage,
      this.twoYearOldClosePrice,
      this.oneYearPL,
      this.oneYearPLPercentage,
      this.oneYearOldClosePrice,
      this.ytd,
      this.ytdPercentage,
      this.ytdSpy,
      this.oneYearSpy,
      this.twoYearSpy,
      this.threeYearSpy
    );
  };
}

module.exports = {
  StockQuoteBuilder,
};
