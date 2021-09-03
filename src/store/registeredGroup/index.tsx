import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RegisteredGroup } from "../../models/types.registeredGroup";
import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import { RegisteredGroupConfig } from "../../helper/realtimeDatabaseStream";

export interface RegisteredGroupState {
  data: RegisteredGroup.Record;
  status: string;
  error: {};
}

const initialState: RegisteredGroupState = { data: {}, status: "idle", error: {} };

const fetchRegisteredGroups = createAsyncThunk("registeredGroups/all", async (): Promise<RegisteredGroup.Record> => {
  const config: AxiosRequestConfig = {
    url: RegisteredGroupConfig.getURL(),
  };
  try {
    const response: AxiosResponse<RegisteredGroup.Record> = await axios.request<RegisteredGroup.Record>(config);
    return response.data;
  } catch (error: any) {
    throw error;
  }
});

const registeredGroupSlice = createSlice({
  name: "registeredGroup",
  initialState,
  reducers: {},
  extraReducers: {
    [fetchRegisteredGroups.pending.type]: (state, action) => {
      state.data = {};
      state.status = "loading";
      state.error = {};
    },
    [fetchRegisteredGroups.fulfilled.type]: (state, action) => {
      state.data = action.payload;
      state.status = "idle";
      state.error = {};
    },
    [fetchRegisteredGroups.rejected.type]: (state, action) => {
      state.data = {};
      state.status = "error";
      state.error = action.error;
    },
  },
});

// Action creators are generated for each case reducer function
export { fetchRegisteredGroups };
export default registeredGroupSlice.reducer;
