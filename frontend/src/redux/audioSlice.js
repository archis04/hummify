// redux/audioSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Upload to Cloudinary & MongoDB
export const uploadAudio = createAsyncThunk("audio/upload", async (formData) => {
  const res = await axios.post("/api/audio/upload", formData);
  return res.data.data; // savedAudio document
});

// Analyze pitch → notes
export const analyzeAudio = createAsyncThunk("audio/analyze", async (audioUrl) => {
  const res = await axios.post("/api/audio/analyze", { audioUrl });
  return res.data; // { notes: [...] }
});

// Convert notes → instrument sound
export const convertAudio = createAsyncThunk("audio/convert", async ({ notes, instrument }) => {
  const res = await axios.post("/api/audio/convert", { notes, instrument });
  return res.data; // { url: convertedAudioURL }
});

const audioSlice = createSlice({
  name: "audio",
  initialState: {
    loading: false,
    error: null,
    uploadedAudio: null,
    notes: [],
    convertedUrl: "",
    stage: "", // e.g., "uploading", "uploaded", "analyzing", "analyzed", "converting", "done"
  },
  reducers: {
    resetState: (state) => {
      state.loading = false;
      state.error = null;
      state.uploadedAudio = null;
      state.notes = [];
      state.convertedUrl = "";
      state.stage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload audio
      .addCase(uploadAudio.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.stage = "uploading";
      })
      .addCase(uploadAudio.fulfilled, (state, action) => {
        state.loading = false;
        state.uploadedAudio = action.payload;
        state.stage = "uploaded";
      })
      .addCase(uploadAudio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Analyze audio
      .addCase(analyzeAudio.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.stage = "analyzing";
      })
      .addCase(analyzeAudio.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload.notes;
        state.stage = "analyzed";
      })
      .addCase(analyzeAudio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Convert audio
      .addCase(convertAudio.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.stage = "converting";
      })
      .addCase(convertAudio.fulfilled, (state, action) => {
        state.loading = false;
        state.convertedUrl = action.payload.url;
        state.stage = "done";
      })
      .addCase(convertAudio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { resetState } = audioSlice.actions;
export default audioSlice.reducer;
