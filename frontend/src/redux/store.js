import { configureStore } from '@reduxjs/toolkit';
import instrumentReducer from '../redux/instrumentSlice'
import audioReducer from '../redux/audioSlice';

export default configureStore({
  reducer: {
    instrument: instrumentReducer,
    audio: audioReducer,
  },
});