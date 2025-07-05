// frontend/src/redux/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { resetAudioState } from './audioSlice'; // Import the new action

const initialState = {
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue, dispatch }) => { // Added dispatch
    try {
      const response = await axios.post('/api/auth/register', userData);
      dispatch(resetAudioState()); // Reset audio state on successful registration
      return response.data;
    } catch (error) {
      const message = (error.response && error.response.data && error.response.data.error) || error.message || error.toString();
      return rejectWithValue(message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue, dispatch }) => { // Added dispatch
    try {
      const response = await axios.post('/api/auth/login', userData);
      dispatch(resetAudioState()); // Reset audio state on successful login
      return response.data;
    } catch (error) {
      const message = (error.response && error.response.data && error.response.data.error) || error.message || error.toString();
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue, dispatch }) => { // Added dispatch
    try {
      await axios.get('/api/auth/logout');
      dispatch(resetAudioState()); // Reset audio state on successful logout
      return true;
    } catch (error) {
      const message = (error.response && error.response.data && error.response.data.error) || error.message || error.toString();
      // Even if logout fails on backend, ensure client-side state (including audio) is cleared
      dispatch(resetAudioState());
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    setAuth: (state, action) => { // This reducer is probably not used with thunks for setting auth
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      })

      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      })

      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      });
  },
});

export const { clearAuthError, setAuth } = authSlice.actions;
export default authSlice.reducer;