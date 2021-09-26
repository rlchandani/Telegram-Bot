import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MentionedTickerNormalized } from "../../models/types.mentionedTickerNormalized";
import { RealtimeDatabase } from "../../models/types.realtimeDatabase";
import { patchProcessor, putProcessor } from "../helpers/util.helpers";

interface MentionedTickerNormalizedDailyState {
  data: MentionedTickerNormalized.Record;
}

const initialState: MentionedTickerNormalizedDailyState = { data: {} };

const mentionedTickerNormalizedDailySlice = createSlice({
  name: "mentionedTickerNormalizedDaily",
  initialState,
  reducers: {
    put: (state, action: PayloadAction<RealtimeDatabase.StreamPayload>) => {
      // console.log("Calling Put", action.payload);
      state.data = putProcessor(state, action.payload);
    },
    patch: (state, action) => {
      // console.log("Calling Patch", action.payload);
      state.data = patchProcessor(state, action.payload);
    },
  },
});

// Action creators are generated for each case reducer function
export const { put, patch } = mentionedTickerNormalizedDailySlice.actions;
export default mentionedTickerNormalizedDailySlice.reducer;
