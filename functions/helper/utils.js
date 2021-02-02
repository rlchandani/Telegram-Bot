"use strict";

exports.getTimestamp = (timezone) => {
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
