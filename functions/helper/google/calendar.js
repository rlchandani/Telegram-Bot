"use strict";

const axios = require("axios");

const googleCalendarURI = "https://www.googleapis.com/calendar/v3/calendars";
const indiaCalendar = encodeURIComponent("en.indian#holiday@group.v.calendar.google.com");
const usaCalendar = encodeURIComponent("en.usa#holiday@group.v.calendar.google.com");
const usaFilteredEventList = ["Cinco de Mayo", "Independence Day observed", "Super Tuesday (regional holiday)"];

const getDateString = (timezone) => {
  const todayUTC = new Date();
  const todayInTimezone = new Date(todayUTC.toLocaleString("en-US", { timeZone: timezone }));
  const d = todayInTimezone.getDate();
  const m = todayInTimezone.getMonth() + 1;
  const y = todayInTimezone.getFullYear();
  return y + "-" + (m <= 9 ? "0" + m : m) + "-" + (d <= 9 ? "0" + d : d);
};

const getEventsFromGoogleForToday = async (apiKey, calendarId, timezone) => {
  const timeMin = getDateString(timezone) + "T00:00:00.00Z";
  const timeMax = getDateString(timezone) + "T23:59:59.00Z";
  const response = await axios.get(
    `${googleCalendarURI}/${calendarId}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}`
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
    (event) => event.status === "confirmed" && !usaFilteredEventList.includes(event.summary)
  );
  return todayEvents.map((event) => event.summary);
};
