import { configureStore } from '@reduxjs/toolkit';
import instrumentReducer from '../redux/instrumentSlice'
import audioReducer from '../redux/audioSlice';
import authReducer from './authSlice';

export default configureStore({
  reducer: {
    instrument: instrumentReducer,
    audio: audioReducer,
    auth: authReducer,
  },
});