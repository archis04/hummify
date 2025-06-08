// frontend/src/redux/audioSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunk for uploading audio directly from here
export const uploadAudio = createAsyncThunk(
  "audio/uploadAudio",
  async (formData,
    // { rejectWithValue }
  ) => {
    try {
      const response = await axios.post("http://localhost:5000/api/audio/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Upload success", response.data);
      return response.data;
    } catch (err) {
      // return rejectWithValue(err.response?.data?.error || "Upload failed");
      console.error("Upload failed:", err.response?.data || err.message);
    }
    // try {
    //   const res = await axios.post("http://localhost:5000/api/audio/upload", formData, {
    //     headers: {
    //       "Content-Type": "multipart/form-data",
    //     },
    //   });
    //   console.log("Upload success", res.data);
    // } catch (error) {
    //   console.error("Upload failed:", error.response?.data || error.message);
    // }

  }
);

const audioSlice = createSlice({
  name: "audio",
  initialState: {
    loading: false,
    error: null,
    audioUrl: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(uploadAudio.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.audioUrl = null;
        console.log(state.loading);

      })
      .addCase(uploadAudio.fulfilled, (state, action) => {
        state.loading = false;
        state.audioUrl = action.payload;
        console.log(action);
        
        
        
      })
      .addCase(uploadAudio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.log(state.error);
        
      });
  },
});

export default audioSlice.reducer;
