import { combineReducers } from "@reduxjs/toolkit";
import mentionedTickerNormalized from "./mentionedTickerNormalized";
import registeredGroup from "./registeredGroup";
import registeredUser from "./registeredUser";

const reducer = combineReducers({
  mentionedTickerNormalized,
  registeredGroup,
  registeredUser,
});

export default reducer;
