import "../../styles/home.css";
import seattle from "../../images/seattle.png";
import _ from "lodash";
import moment from "moment-timezone";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Menu, Dropdown, Message, Segment, Divider, Header } from "semantic-ui-react";
import PerformanceDetailTable, { PerformanceDetailTableOptions } from "../../components/tables/PerformanceDetailTable";
import "../../helper/initFirebase";
import { MentionedTickerNormalizedConfig, refreshDelay } from "../../helper/realtimeDatabaseStream";
import { patch, put } from "../../store/mentionedTickerNormalized";
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
  const mentionedTickerNormalized = useSelector((state: any) => state.mentionedTickerNormalized);

  let ping = new Date();
  const [activeMenuItem, setActiveMenuItem] = useState("home");
  const [groupDropdownOptions, setGroupDropdownOptions] = useState<any>([]);
  const [eventSource, setEventSource] = useState<EventSource | undefined | null>();
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
    eventSource?.close();
    // Clearning interval
    clearInterval(ttlTimer);

    // Starting listener
    if (groupId) {
      const tempEventSource = new EventSource(MentionedTickerNormalizedConfig.getURL(groupId));

      // listen on ping from server, keep time
      tempEventSource.addEventListener("keep-alive", () => {
        console.log("Keep-Alive event:", new Date());
        ping = new Date();
        setRefreshData(ping);
      });

      // listen for database PUT operations
      tempEventSource.addEventListener("put", (e: any) => {
        ping = new Date();
        dispatch(put(JSON.parse(e.data)));
      });

      // listen for database PATCH operations
      tempEventSource.addEventListener("patch", (e: any) => {
        ping = new Date();
        dispatch(patch(JSON.parse(e.data)));
      });

      // listen for database CANCEL operations
      tempEventSource.addEventListener("cancel", (e: any) => {
        console.log("CANCEL event:", e.data);
      });

      // listen for database OPEN operations
      tempEventSource.addEventListener("open", () => {
        console.log("Open SSE connection");
        ping = new Date();
        setRefreshData(ping);
      });

      // listen for database CLOSE operations
      tempEventSource.addEventListener("close", () => {
        console.log("Close SSE connection");
        setRefreshData(ping);
      });

      // listen for database ERROR operations
      tempEventSource.addEventListener("error", (e: any) => {
        if (e.type === "error") {
          console.error("Connection error:", e.message);
        } else if (e.type === "exception") {
          console.error("Error:", e.message, e.error);
        }
        console.error("Unknown exception:", e);
      });

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

      setEventSource(tempEventSource);
      setTtlTimer(tempTtlTimer);
    }
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
      mentionedTickerNormalized.status !== "error" &&
      !_.isEmpty(mentionedTickerNormalized.data)
    ) {
      const tempTableData: any = [];
      _.map(mentionedTickerNormalized.data, (tickers, date: number) => {
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
      setWeeklyTableData([]);
    }
  }, [mentionedTickerNormalized, registeredUser, refreshData]);

  const tableHeader: PerformanceDetailTableOptions.TableHeader = {
    1: { key: "date", value: "Date" },
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
                startListener(d.value)
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
          tableHeader={tableHeader}
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
          tableHeader={tableHeader}
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
