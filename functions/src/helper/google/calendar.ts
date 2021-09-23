import axios from "axios";
import moment from "moment-timezone";

const googleCalendarURI = "https://www.googleapis.com/calendar/v3/calendars";
const indiaCalendar = encodeURIComponent("en.indian#holiday@group.v.calendar.google.com");
const usaCalendar = encodeURIComponent("en.usa#holiday@group.v.calendar.google.com");
const usaFilteredEventList = ["Cinco de Mayo", "Independence Day observed", "Super Tuesday (regional holiday)"];

const getEventsFromGoogleForToday = async (apiKey: any, calendarId: any, timezone: any) => {
  const timeMin = moment().tz(timezone).format("YYYY-MM-DD") + "T00:00:00.00Z";
  const timeMax = moment().tz(timezone).format("YYYY-MM-DD") + "T23:59:59.00Z";
  const response = await axios.get(`${googleCalendarURI}/${calendarId}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}`);
  return response.data.items;
};

const getIndiaEvents = async (apiKey: any) => {
  return await getEventsFromGoogleForToday(apiKey, indiaCalendar, "Asia/Kolkata");
};

const getUSAEvents = async (apiKey: any) => {
  return getEventsFromGoogleForToday(apiKey, usaCalendar, "America/Los_Angeles");
};

export const getTodayEventIndia = async (apiKey: any) => {
  const events = await getIndiaEvents(apiKey);
  const todayEvents = events.filter((event: any) => event.status === "confirmed");
  return todayEvents.map((event: any) => event.summary);
};

export const getTodayEventUSA = async (apiKey: any) => {
  const events = await getUSAEvents(apiKey);
  const todayEvents = events.filter((event: any) => event.status === "confirmed" && !usaFilteredEventList.includes(event.summary));
  return todayEvents.map((event: any) => event.summary);
};
