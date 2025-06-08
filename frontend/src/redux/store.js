// frontend/src/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import audioReducer from "../redux/audioSlice.js";

export const store = configureStore({
  reducer: {
    audio: audioReducer,
  },
});
