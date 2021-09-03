import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RegisteredUser } from "../../models/types.registeredUser";
import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import { RegisteredUserConfig } from "../../helper/realtimeDatabaseStream";

export interface RegisteredUserState {
  data: RegisteredUser.Record;
  status: string;
  error: {};
}

const initialState: RegisteredUserState = { data: {}, status: "idle", error: {} };

const fetchRegisteredUsers = createAsyncThunk("registeredUsers/all", async (): Promise<RegisteredUser.Record> => {
  const config: AxiosRequestConfig = {
    url: RegisteredUserConfig.getURL(),
  };
  try {
    const response: AxiosResponse<RegisteredUser.Record> = await axios.request<RegisteredUser.Record>(config);
    return response.data;
  } catch (error: any) {
    throw error;
  }
});

const registeredUserSlice = createSlice({
  name: "registeredUser",
  initialState,
  reducers: {},
  extraReducers: {
    [fetchRegisteredUsers.pending.type]: (state, action) => {
      state.data = {};
      state.status = "loading";
      state.error = {};
    },
    [fetchRegisteredUsers.fulfilled.type]: (state, action) => {
      state.data = action.payload;
      state.status = "idle";
      state.error = {};
    },
    [fetchRegisteredUsers.rejected.type]: (state, action) => {
      state.data = {};
      state.status = "error";
      state.error = action.error;
    },
  },
});

// Action creators are generated for each case reducer function
export { fetchRegisteredUsers };
export default registeredUserSlice.reducer;
