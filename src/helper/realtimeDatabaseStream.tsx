import moment from "moment-timezone";

// Refresh delay to check if connection is still open
const refreshDelay = 10000; // millis
const isDebug = window.location.hostname === "localhost" ? true : false;
const todayEpoch = moment().tz("America/Los_Angeles").startOf("day").unix();
const todayWeekEpoch = moment().tz("America/Los_Angeles").startOf("week").unix();
const startEpoch = moment().tz("America/Los_Angeles").startOf("day").subtract(1, "days").unix();
const endEpoch = todayEpoch;
const weekStartEpoch = moment().tz("America/Los_Angeles").startOf("week").unix();
const weekEndEpoch = moment().tz("America/Los_Angeles").endOf("week").unix();

class RegisteredUserConfig {
  static debug = {
    baseURL: "http://localhost:9000/registeredUser",
    params: `ns=telegram-bot-e91d5-default-rtdb&print=pretty&timeout=1s&orderBy=%22is_bot%22&equalTo=false`,
  };
  static prod = {
    baseURL: "https://telegram-bot-e91d5-default-rtdb.firebaseio.com/registeredUser",
    params: `print=pretty&timeout=1s&orderBy=%22is_bot%22&equalTo=false`,
  };

  static getURL() {
    if (isDebug) {
      return `${this.debug.baseURL}.json?${this.debug.params}`;
    }
    return `${this.prod.baseURL}.json?${this.prod.params}`;
  }
}

class RegisteredGroupConfig {
  static debug = {
    baseURL: "http://localhost:9000/registeredGroup",
    params: `ns=telegram-bot-e91d5-default-rtdb&print=pretty&timeout=1s&orderBy=%22title%22`,
  };
  static prod = {
    baseURL: "https://telegram-bot-e91d5-default-rtdb.firebaseio.com/registeredGroup",
    // params: `print=pretty&timeout=1s&orderBy=%22type%22&equalTo=%22group%22`,
    params: `print=pretty&timeout=1s&orderBy=%22enabled%22&equalTo=true`,
  };

  static getURL() {
    if (isDebug) {
      return `${this.debug.baseURL}.json?${this.debug.params}`;
    }
    return `${this.prod.baseURL}.json?${this.prod.params}`;
  }
}

class MentionedTickerConfig {
  static debug = {
    baseURL: "http://localhost:9000/mentionedTicker",
    params: `ns=telegram-bot-e91d5-default-rtdb&print=pretty&timeout=1s&orderBy=%22day%22&equalTo=%22${todayEpoch}%22`,
    testGroupId: -431765838,
  };
  static prod = {
    baseURL: "https://telegram-bot-e91d5-default-rtdb.firebaseio.com/mentionedTicker",
    params: `print=pretty&timeout=1s&orderBy=%22day%22&equalTo=%22${todayEpoch}`,
    testGroupId: -589891838,
  };

  static getURL(groupId?: string) {
    if (isDebug) {
      return `${this.debug.baseURL}/${groupId || this.debug.testGroupId}.json?${this.debug.params}`;
    }
    return `${this.prod.baseURL}/${groupId || this.prod.testGroupId}.json?${this.prod.params}`;
  }
}

class MentionedTickerNormalizedDailyConfig {
  static debug = {
    baseURL: "http://localhost:9000/mentionedTickerNormalizedDaily",
    params: `ns=telegram-bot-e91d5-default-rtdb&print=pretty&timeout=1s&orderBy=%22$key%22&startAt=%22${startEpoch}%22&endAt=%22${endEpoch}%22`,
    testGroupId: -431765838,
  };
  static prod = {
    baseURL: "https://telegram-bot-e91d5-default-rtdb.firebaseio.com/mentionedTickerNormalizedDaily",
    params: `print=pretty&timeout=1s&orderBy=%22$key%22&equalTo=%22${todayEpoch}%22`,
    testGroupId: -589891838,
  };

  static getURL(groupId?: string) {
    if (isDebug) {
      return `${this.debug.baseURL}/${groupId || this.debug.testGroupId}.json?${this.debug.params}`;
    }
    return `${this.prod.baseURL}/${groupId || this.prod.testGroupId}.json?${this.prod.params}`;
  }
}

class MentionedTickerNormalizedWeeklyConfig {
  static debug = {
    baseURL: "http://localhost:9000/mentionedTickerNormalizedWeekly",
    params: `ns=telegram-bot-e91d5-default-rtdb&print=pretty&timeout=1s&orderBy=%22$key%22&startAt=%22${weekStartEpoch}%22&endAt=%22${weekEndEpoch}%22`,
    testGroupId: -431765838,
  };
  static prod = {
    baseURL: "https://telegram-bot-e91d5-default-rtdb.firebaseio.com/mentionedTickerNormalizedWeekly",
    params: `print=pretty&timeout=1s&orderBy=%22$key%22&equalTo=%22${todayWeekEpoch}%22`,
    testGroupId: -589891838,
  };

  static getURL(groupId?: string) {
    if (isDebug) {
      return `${this.debug.baseURL}/${groupId || this.debug.testGroupId}.json?${this.debug.params}`;
    }
    return `${this.prod.baseURL}/${groupId || this.prod.testGroupId}.json?${this.prod.params}`;
  }
}

export {
  RegisteredUserConfig,
  RegisteredGroupConfig,
  MentionedTickerConfig,
  MentionedTickerNormalizedDailyConfig,
  MentionedTickerNormalizedWeeklyConfig,
  refreshDelay,
};
