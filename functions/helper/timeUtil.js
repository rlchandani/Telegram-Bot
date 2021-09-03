const moment = require("moment-timezone");

const isTimeBetween = (startTime, endTime, serverTime) => {
  const start = moment(startTime, "H:mm");
  const end = moment(endTime, "H:mm");
  const server = moment(serverTime, "H:mm");
  if (end < start) {
    return (server >= start && server <= moment("23:59:59", "h:mm:ss")) || (server >= moment("0:00:00", "h:mm:ss") && server < end);
  }
  return server >= start && server < end;
};

exports.is9AM = (timezone = "America/Los_Angeles") => {
  return isTimeBetween("09:00", "09:01", moment().tz(timezone).format("HH:mm"));
};

exports.is4PM = (timezone = "America/Los_Angeles") => {
  return isTimeBetween("16:00", "16:01", moment().tz(timezone).format("HH:mm"));
};

exports.is6PM = (timezone = "America/Los_Angeles") => {
  return isTimeBetween("18:00", "18:01", moment().tz(timezone).format("HH:mm"));
};

exports.nowHour = (timezone = "America/Los_Angeles") => {
  return moment().tz(timezone).format("YYYY-MM-DDTHH");
};

exports.expireIn2Hours = (timezone = "America/Los_Angeles") => {
  return moment().tz(timezone).add(2, "hour").set({ minute: 0, second: 0, millisecond: 0 });
};

exports.expireIn3Hours = (timezone = "America/Los_Angeles") => {
  return moment().tz(timezone).add(3, "hour").set({ minute: 0, second: 0, millisecond: 0 });
};

exports.expireIn24Hours = (timezone = "America/Los_Angeles") => {
  return moment().tz(timezone).add(24, "hour").set({ minute: 0, second: 0, millisecond: 0 });
};

exports.currentWeekDays = (timezone = "America/Los_Angeles") => {
  const days = [];
  const currentDate = moment().tz(timezone);
  const weekStart = currentDate.clone().startOf("isoWeek");
  // const weekEnd = currentDate.clone().endOf("isoWeek");
  for (let i = 0; i <= 6; i++) {
    const day = moment(weekStart).add(i, "days");
    if (day.isBefore()) {
      days.push(day.unix());
    }
  }
  return days;
};
