// frontend/src/redux/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Initial state for authentication
const initialState = {
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'), // True if token exists
  loading: false, // For async operations
  error: null, // To store any error messages
};

// Async Thunks for user authentication
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      // Backend should return user data and token on successful registration
      return response.data;
    } catch (error) {
      // Extract the error message from the backend response
      const message =
        (error.response && error.response.data && error.response.data.error) ||
        error.message ||
        error.toString();
      // Use rejectWithValue to pass the error message to the rejected action
      return rejectWithValue(message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/login', userData);
      // Backend should return user data and token on successful login
      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.error) ||
        error.message ||
        error.toString();
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Make a call to the backend logout endpoint (if you have one, or just clear local storage)
      await axios.get('/api/auth/logout'); // Assumes your backend has a /api/auth/logout endpoint
      // No data to return on successful logout, just handle local state clear
      return true; // Indicate success
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.error) ||
        error.message ||
        error.toString();
      // Even if backend logout fails, we'll try to clear local state in the extraReducer
      return rejectWithValue(message);
    }
  }
);


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // If you need direct reducers for state manipulation (e.g., clearing errors manually)
    clearAuthError: (state) => {
      state.error = null;
    },
    // This reducer is useful if you want to explicitly set the user and token
    // for instance, if you get them from a redirect URL (less common with our setup now)
    setAuth: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
    },
  },
  extraReducers: (builder) => {
    builder
      // Register User
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null; // Clear any previous errors when starting registration
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null; // Clear error on success
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload; // Set the error message from rejectWithValue
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      })

      // Login User
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null; // Clear any previous errors when starting login
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null; // Clear error on success
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload; // Set the error message
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      })

      // Logout User
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
        // Even if the backend logout failed, we force local state clear for safety
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload; // Still show the error from backend if any
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      });
  },
});

export const { clearAuthError, setAuth } = authSlice.actions; // Export clearAuthError action
export default authSlice.reducer;