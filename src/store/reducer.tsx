import { combineReducers } from "@reduxjs/toolkit";
import mentionedTickerNormalizedDaily from "./mentionedTickerNormalizedDaily";
import mentionedTickerNormalizedWeekly from "./mentionedTickerNormalizedWeekly";
import registeredGroup from "./registeredGroup";
import registeredUser from "./registeredUser";

const reducer = combineReducers({
  mentionedTickerNormalizedDaily,
  mentionedTickerNormalizedWeekly,
  registeredGroup,
  registeredUser,
});

export default reducer;
