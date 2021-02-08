"use strict";

const moment = require("moment-timezone");

const isTimeBetween = (startTime, endTime, serverTime) => {
  const start = moment(startTime, "H:mm");
  const end = moment(endTime, "H:mm");
  const server = moment(serverTime, "H:mm");
  if (end < start) {
    return (
      (server >= start && server <= moment("23:59:59", "h:mm:ss")) ||
      (server >= moment("0:00:00", "h:mm:ss") && server < end)
    );
  }
  return server >= start && server < end;
};

exports.is9AM = (timezone = "America/Los_Angeles") => {
  return isTimeBetween("09:00", "09:01", moment().tz(timezone).format("HH:mm"));
};

exports.is4PM = (timezone = "America/Los_Angeles") => {
  return isTimeBetween("16:00", "16:01", moment().tz(timezone).format("HH:mm"));
};

exports.nowHour = (timezone = "America/Los_Angeles") => {
  return moment().tz(timezone).format("YYYY-MM-DDTHH");
};

exports.expiringTime = (timezone = "America/Los_Angeles") => {
  return moment().tz(timezone).subtract(24, "hours").format("YYYY-MM-DDTHH");
};

exports.currentWeekDays = (timezone = "America/Los_Angeles") => {
  const days = [];
  const currentDate = moment().tz(timezone);
  const weekStart = currentDate.clone().startOf("isoWeek");
  // const weekEnd = currentDate.clone().endOf("isoWeek");
  for (let i = 0; i <= 6; i++) {
    days.push(moment(weekStart).add(i, "days").unix());
  }
  return days;
};