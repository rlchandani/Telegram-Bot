import "../../styles/home.css";
import seattle from "../../images/seattle.png";
import _ from "lodash";
import moment from "moment-timezone";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Menu, Dropdown, Message, Segment, Divider, Header } from "semantic-ui-react";
import PerformanceDetailTable, { PerformanceDetailTableOptions } from "../../components/tables/PerformanceDetailTable";
import "../../helper/initFirebase";
import { MentionedTickerNormalizedDailyConfig, MentionedTickerNormalizedWeeklyConfig, refreshDelay } from "../../helper/realtimeDatabaseStream";
import * as mentionedTickerNormalizedDaily from "../../store/mentionedTickerNormalizedDaily";
import * as mentionedTickerNormalizedWeekly from "../../store/mentionedTickerNormalizedWeekly";
import { fetchRegisteredGroups, RegisteredGroupState } from "../../store/registeredGroup";
import { fetchRegisteredUsers, RegisteredUserState } from "../../store/registeredUser";
// import { getDatabase, connectDatabaseEmulator, ref, set } from "firebase/database";

// const db = getDatabase();
// if (window.location.hostname === "localhost") {
//   // Point to the RTDB emulator running on localhost.
//   connectDatabaseEmulator(db, "localhost", 9000);
// }
// set(ref(db, "test/"), { username: "Neha" });

const Home = () => {
  const dispatch = useDispatch();
  const registeredUser: RegisteredUserState = useSelector((state: any) => state.registeredUser);
  const registeredGroup: RegisteredGroupState = useSelector((state: any) => state.registeredGroup);
  const mentionedTickerNormalizedDailyStore = useSelector((state: any) => state.mentionedTickerNormalizedDaily);
  const mentionedTickerNormalizedWeeklyStore = useSelector((state: any) => state.mentionedTickerNormalizedWeekly);

  let ping = new Date();
  const [activeMenuItem, setActiveMenuItem] = useState("home");
  const [groupDropdownOptions, setGroupDropdownOptions] = useState<any>([]);
  const [dailyEventSource, setDailyEventSource] = useState<EventSource | undefined | null>();
  const [weeklyEventSource, setWeeklyEventSource] = useState<EventSource | undefined | null>();
  const [ttlTimer, setTtlTimer] = useState<any>();
  const [dailyTableData, setDailyTableData] = useState<PerformanceDetailTableOptions.TableData[]>([]);
  const [weeklyTableData, setWeeklyTableData] = useState<PerformanceDetailTableOptions.TableData[]>([]);
  const [refreshData, setRefreshData] = useState(ping);
  const [selectedGroup, setSelectedGroup] = useState<any>();

  const handleItemClick = (e: any, d: any) => setActiveMenuItem(d.name);

  const initLoadRegisteredUser = () => {
    dispatch(fetchRegisteredUsers());
  };

  const initLoadRegisteredGroup = () => {
    dispatch(fetchRegisteredGroups());
  };

  const startListener = (groupId: any) => { 
    // Terminate existing connection
    dailyEventSource?.close();
    weeklyEventSource?.close();
    // Clearning interval
    clearInterval(ttlTimer);

    // Starting listener for MentionedTickerNormalizedDaily
    if (groupId) {
      const tempDailyEventSource = new EventSource(MentionedTickerNormalizedDailyConfig.getURL(groupId));

      // listen on ping from server, keep time
      tempDailyEventSource.addEventListener("keep-alive", () => {
        console.log("MentionedTickerNormalizedDaily Keep-Alive event:", new Date());
        ping = new Date();
        setRefreshData(ping);
      });

      // listen for database PUT operations
      tempDailyEventSource.addEventListener("put", (e: any) => {
        ping = new Date();
        dispatch(mentionedTickerNormalizedDaily.put(JSON.parse(e.data)));
      });

      // listen for database PATCH operations
      tempDailyEventSource.addEventListener("patch", (e: any) => {
        ping = new Date();
        dispatch(mentionedTickerNormalizedDaily.patch(JSON.parse(e.data)));
      });

      // listen for database CANCEL operations
      tempDailyEventSource.addEventListener("cancel", (e: any) => {
        console.log("MentionedTickerNormalizedDaily CANCEL event:", e.data);
      });

      // listen for database OPEN operations
      tempDailyEventSource.addEventListener("open", () => {
        console.log("Open MentionedTickerNormalizedDaily SSE connection");
        ping = new Date();
        setRefreshData(ping);
      });

      // listen for database CLOSE operations
      tempDailyEventSource.addEventListener("close", () => {
        console.log("Close MentionedTickerNormalizedDaily SSE connection");
        setRefreshData(ping);
      });

      // listen for database ERROR operations
      tempDailyEventSource.addEventListener("error", (e: any) => {
        if (e.type === "error") {
          console.error("Connection error:", e.message);
        } else if (e.type === "exception") {
          console.error("Error:", e.message, e.error);
        }
        console.error("Unknown exception:", e);
      });
      setDailyEventSource(tempDailyEventSource);
    }

    // Starting listener for MentionedTickerNormalizedWeekly
    if (groupId) {
      const tempWeeklyEventSource = new EventSource(MentionedTickerNormalizedWeeklyConfig.getURL(groupId));

      // listen on ping from server, keep time
      tempWeeklyEventSource.addEventListener("keep-alive", () => {
        console.log("MentionedTickerNormalizedDaily Keep-Alive event:", new Date());
        ping = new Date();
        setRefreshData(ping);
      });

      // listen for database PUT operations
      tempWeeklyEventSource.addEventListener("put", (e: any) => {
        ping = new Date();
        dispatch(mentionedTickerNormalizedWeekly.put(JSON.parse(e.data)));
      });

      // listen for database PATCH operations
      tempWeeklyEventSource.addEventListener("patch", (e: any) => {
        ping = new Date();
        dispatch(mentionedTickerNormalizedWeekly.patch(JSON.parse(e.data)));
      });

      // listen for database CANCEL operations
      tempWeeklyEventSource.addEventListener("cancel", (e: any) => {
        console.log("MentionedTickerNormalizedDaily CANCEL event:", e.data);
      });

      // listen for database OPEN operations
      tempWeeklyEventSource.addEventListener("open", () => {
        console.log("Open MentionedTickerNormalizedWeekly SSE connection");
        ping = new Date();
        setRefreshData(ping);
      });

      // listen for database CLOSE operations
      tempWeeklyEventSource.addEventListener("close", () => {
        console.log("Close MentionedTickerNormalizedDaily SSE connection");
        setRefreshData(ping);
      });

      // listen for database ERROR operations
      tempWeeklyEventSource.addEventListener("error", (e: any) => {
        if (e.type === "error") {
          console.error("Connection error:", e.message);
        } else if (e.type === "exception") {
          console.error("Error:", e.message, e.error);
        }
        console.error("Unknown exception:", e);
      });
      setWeeklyEventSource(tempWeeklyEventSource);
    }
    // check if the realtime connection is dead, reload client if dead
    const tempTtlTimer = setInterval(() => {
      let now = new Date().getTime();
      let diff = (now - ping.getTime()) / 1000;
      // haven't heard from the server in 20 secs?
      if (diff > 45) {
        // hard reload of client
        window.location.reload();
      }
    }, refreshDelay);
    setTtlTimer(tempTtlTimer);
  };

  useEffect(() => {
    initLoadRegisteredUser();
    initLoadRegisteredGroup();
  }, []);

  useEffect(() => {
    if (registeredGroup.status !== "error" && !_.isEmpty(registeredGroup.data)) {
      let tempGroupOptions = _.map(registeredGroup.data, (group, index) => ({
        key: group.id.toString(),
        text: group.title || group.first_name,
        value: group.id.toString(),
      }));
      setGroupDropdownOptions(_.orderBy(tempGroupOptions, ["text"], ["asc"]));
    }
  }, [registeredGroup]);

  useEffect(() => {
    if (
      registeredUser.status !== "error" &&
      !_.isEmpty(registeredUser.data) &&
      mentionedTickerNormalizedDailyStore.status !== "error" &&
      !_.isEmpty(mentionedTickerNormalizedDailyStore.data)
    ) {
      const tempTableData: any = [];
      _.map(mentionedTickerNormalizedDailyStore.data, (tickers, date: number) => {
        _.map(tickers, (tickerData, ticker) => {
          const tempUserInfo = _.map(tickerData.users, (userStats, userId) => ({
            first_name: _.find(registeredUser.data, (userInfo, uId) => uId === userId)?.first_name,
            total: userStats.total,
          }));
          const updatedOnObject = moment.unix(tickerData.updatedOn);
          const updatedOn = updatedOnObject.isSame(new Date(), "day") ? updatedOnObject.fromNow() : updatedOnObject.format("h:mm A");
          const tempData = {
            date: moment.unix(date).format("YYYY-MM-DD"),
            ticker: `<a href='https://robinhood.com/stocks/${ticker}' target='_blank'>${ticker}</a>&nbsp;<a class="ui label">$${tickerData.price}</a>`,
            total: tickerData.total,
            unique_user: _.size(tempUserInfo),
            appendix: _.chain(tempUserInfo)
              .sortBy(["total", "first_name"])
              .reverse()
              .map((d) => `<div class="ui teal label">${d.first_name}<div class="detail">${d.total}</div></div>`)
              .join("&nbsp;")
              .value(),
            updated_on: updatedOn,
          };
          tempTableData.push(tempData);
        });
      });
      setDailyTableData(tempTableData);
    } else {
      setDailyTableData([]);
    }
  }, [mentionedTickerNormalizedDailyStore, registeredUser, refreshData]);

  useEffect(() => {
    if (
      registeredUser.status !== "error" &&
      !_.isEmpty(registeredUser.data) &&
      mentionedTickerNormalizedWeeklyStore.status !== "error" &&
      !_.isEmpty(mentionedTickerNormalizedWeeklyStore.data)
    ) {
      const tempTableData: any = [];
      _.map(mentionedTickerNormalizedWeeklyStore.data, (tickers, date: number) => {
        _.map(tickers, (tickerData, ticker) => {
          const tempUserInfo = _.map(tickerData.users, (userStats, userId) => ({
            first_name: _.find(registeredUser.data, (userInfo, uId) => uId === userId)?.first_name,
            total: userStats.total,
          }));
          const updatedOnObject = moment.unix(tickerData.updatedOn);
          const updatedOn = updatedOnObject.isSame(new Date(), "day") ? updatedOnObject.fromNow() : updatedOnObject.format("h:mm A");
          const tempData = {
            date: moment.unix(date).format("YYYY-MM-DD"),
            ticker: `<a href='https://robinhood.com/stocks/${ticker}' target='_blank'>${ticker}</a>&nbsp;<a class="ui label">$${tickerData.price}</a>`,
            total: tickerData.total,
            unique_user: _.size(tempUserInfo),
            appendix: _.chain(tempUserInfo)
              .sortBy(["total", "first_name"])
              .reverse()
              .map((d) => `<div class="ui teal label">${d.first_name}<div class="detail">${d.total}</div></div>`)
              .join("&nbsp;")
              .value(),
            updated_on: updatedOn,
          };
          tempTableData.push(tempData);
        });
      });
      setWeeklyTableData(tempTableData);
    } else {
      setWeeklyTableData([]);
    }
  }, [mentionedTickerNormalizedWeeklyStore, registeredUser, refreshData]);

  const dailyTableHeader: PerformanceDetailTableOptions.TableHeader = {
    1: { key: "date", value: "Date" },
    2: { key: "ticker", value: "Ticker" },
    3: { key: "total", value: "Total Mentioned" },
    4: { key: "unique_user", value: "Total Users" },
    5: { key: "appendix", value: "Appendix" },
    6: { key: "updated_on", value: "Last Mentioned" },
  };

  const weeklyTableHeader: PerformanceDetailTableOptions.TableHeader = {
    1: { key: "date", value: "Week Start Date" },
    2: { key: "ticker", value: "Ticker" },
    3: { key: "total", value: "Total Mentioned" },
    4: { key: "unique_user", value: "Total Users" },
    5: { key: "appendix", value: "Appendix" },
    6: { key: "updated_on", value: "Last Mentioned" },
  };

  const defaultSortOptions: PerformanceDetailTableOptions.SortOptions = {
    key: "total",
    direction: PerformanceDetailTableOptions.SortOrder.Descending,
  };

  return (
    <Container className="container-wrapper">
      <Menu pointing>
        <Menu.Item name="home" active={activeMenuItem === "home"} onClick={handleItemClick} />
        <Menu.Item name="messages" active={activeMenuItem === "messages"} onClick={handleItemClick} />
        <Menu.Menu position="right">
          <Menu.Item className="menu-item-dropdown">
            <Dropdown
              placeholder="Select Telegram Group"
              search
              selection
              scrolling
              closeOnEscape
              fluid
              options={groupDropdownOptions}
              selectOnBlur={false}
              onChange={(e, d) => {
                startListener(d.value);
                setSelectedGroup(d.value);
              }}
              value={selectedGroup}
            />
          </Menu.Item>
        </Menu.Menu>
      </Menu>
      <Message warning header="Under Development!" content="This website is still under development and is only live for testing purpose." />
      <Header as="h3" attached="top">
        Daily Mentioned Ticker Stats
      </Header>
      <Segment attached>
        <PerformanceDetailTable
          tableHeader={dailyTableHeader}
          tableData={dailyTableData}
          sortOptions={defaultSortOptions}
          sortable
          striped
          searchable
          paginated
        />
      </Segment>
      <Header as="h3" attached="top">
        Weekly Mentioned Ticker Stats
      </Header>
      <Segment attached>
        <PerformanceDetailTable
          tableHeader={weeklyTableHeader}
          tableData={weeklyTableData}
          sortOptions={defaultSortOptions}
          sortable
          striped
          searchable
          paginated
        />
      </Segment>
      <Segment className="footer-segment">
        <Divider horizontal>Copyright © {moment().tz("America/Los_Angeles").year()} iRedlof.</Divider>
        Made with <i className="heart red icon" />
        in
        <img src={seattle} title="Seattle, USA" alt="Seattle" />
      </Segment>
    </Container>
  );
};

export default Home;
