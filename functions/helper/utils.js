"use strict";

const moment = require("moment-timezone");

exports.getTimestamp = (timezone = "UTC") => {
  const todayUTC = new Date();
  return new Date(todayUTC.toLocaleString("en-US", { timeZone: timezone }));
};

exports.getDateString = (timezone) => {
  const todayInTimezone = this.getTimestamp(timezone);
  const d = todayInTimezone.getDate();
  const m = todayInTimezone.getMonth() + 1;
  const y = todayInTimezone.getFullYear();
  return y + "-" + (m <= 9 ? "0" + m : m) + "-" + (d <= 9 ? "0" + d : d);
};

exports.is9AM = (timeZone) => {
  const currentD = this.getTimestamp(timeZone);
  const startHappyHourD = this.getTimestamp(timeZone);
  startHappyHourD.setHours(9, 0, 0); // 9.00 am
  const endHappyHourD = this.getTimestamp(timeZone);
  endHappyHourD.setHours(9, 1, 0); // 9.01 am
  return currentD >= startHappyHourD && currentD < endHappyHourD;
};

exports.is4PM = (timeZone) => {
  const currentD = this.getTimestamp(timeZone);
  const startHappyHourD = this.getTimestamp(timeZone);
  startHappyHourD.setHours(16, 0, 0); // 4.00 pm
  const endHappyHourD = this.getTimestamp(timeZone);
  endHappyHourD.setHours(16, 1, 0); // 4.01 pm
  return currentD >= startHappyHourD && currentD < endHappyHourD;
};

exports.nowHour = (timezone = "America/Los_Angeles") => {
  return moment().tz(timezone).format("YYYY-MM-DDTHH");
};

exports.expiringTime = (timezone = "America/Los_Angeles") => {
  return moment().tz(timezone).subtract(24, "hours").format("YYYY-MM-DDTHH");
};

exports.extractTickerSymbolsInsideMessageText= (message) => {
  const re = /\$\w+/g;
  const matches = message.match(re);
  return matches ? [...new Set(matches.map((m) => m.substring(1)))] : [];
};

exports.extractTickerSymbolsFromQuoteCommand = (message) => {
  const re = /(\w+)/g;
  const matches = message.match(re);
  matches.shift();
  return matches;
};
