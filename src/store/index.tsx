import { configureStore } from "@reduxjs/toolkit";
import reducer from "./reducer";

export const initializeStore = () =>
  configureStore({
    reducer,
  });

export default initializeStore();
