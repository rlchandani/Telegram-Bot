const axios = require("axios");
const moment = require("moment-timezone");

const googleCalendarURI = "https://www.googleapis.com/calendar/v3/calendars";
const indiaCalendar = encodeURIComponent("en.indian#holiday@group.v.calendar.google.com");
const usaCalendar = encodeURIComponent("en.usa#holiday@group.v.calendar.google.com");
const usaFilteredEventList = ["Cinco de Mayo", "Independence Day observed", "Super Tuesday (regional holiday)"];

const getEventsFromGoogleForToday = async (apiKey, calendarId, timezone) => {
  const timeMin = moment().tz(timezone).format("YYYY-MM-DD") + "T00:00:00.00Z";
  const timeMax = moment().tz(timezone).format("YYYY-MM-DD") + "T23:59:59.00Z";
  const response = await axios.get(
    `${googleCalendarURI}/${calendarId}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}`,
  );
  return response.data.items;
};

const getIndiaEvents = async (apiKey) => {
  return await getEventsFromGoogleForToday(apiKey, indiaCalendar, "Asia/Kolkata");
};

const getUSAEvents = async (apiKey) => {
  return getEventsFromGoogleForToday(apiKey, usaCalendar, "America/Los_Angeles");
};

exports.getTodayEventIndia = async (apiKey) => {
  const events = await getIndiaEvents(apiKey);
  const todayEvents = events.filter((event) => event.status === "confirmed");
  return todayEvents.map((event) => event.summary);
};

exports.getTodayEventUSA = async (apiKey) => {
  const events = await getUSAEvents(apiKey);
  const todayEvents = events.filter(
    (event) => event.status === "confirmed" && !usaFilteredEventList.includes(event.summary),
  );
  return todayEvents.map((event) => event.summary);
};
