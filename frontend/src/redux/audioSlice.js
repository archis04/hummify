import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../axios.js';

// 🔹 uploadAudio
export const uploadAudio = createAsyncThunk(
  'audio/upload',
  async (audioBlob, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const res = await axios.post('/api/audio/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return res.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Upload failed.';
      return rejectWithValue(message);
    }
  }
);

// 🔹 analyzeAudio
export const analyzeAudio = createAsyncThunk(
  'audio/analyze',
  async (audioUrl, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/audio/analyze', { audioUrl });
      return res.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Analysis failed.';
      return rejectWithValue(message);
    }
  }
);

// 🔹 convertAudio
export const convertAudio = createAsyncThunk(
  'audio/convert',
  async ({ instrument, notes }, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/audio/convert', { instrument, notes });
      return res.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Conversion failed.';
      return rejectWithValue(message);
    }
  }
);

const audioSlice = createSlice({
  name: 'audio',
  initialState: {
    recording: null,
    audioUrl: null,
    analysis: null,
    convertedAudio: null,
    status: 'idle', // idle | uploading | uploaded | analyzing | analyzed | converting | converted | failed
    error: null
  },
  reducers: {
    setRecording: (state, action) => {
      state.recording = action.payload;
    },
    resetAudioState: (state) => {
      state.recording = null;
      state.audioUrl = null;
      state.analysis = null;
      state.convertedAudio = null;
      state.status = 'idle';
      state.error = null;
    },
    setAudioUrl: (state, action) => {
      state.audioUrl = action.payload;
      state.status = 'uploaded';
      state.error = null;
    },
    setAnalysis: (state, action) => {
      state.analysis = action.payload;
      state.status = 'analyzed';
      state.error = null;
    },
    setAudioStatus: (state, action) => {
      state.status = action.payload;
    },
    setConvertedAudio: (state, action) => {
      state.convertedAudio = action.payload;
      state.status = 'converted';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Upload Audio
      .addCase(uploadAudio.pending, (state) => {
        state.status = 'uploading';
        state.error = null;
      })
      .addCase(uploadAudio.fulfilled, (state, action) => {
        state.status = 'uploaded';
        state.audioUrl = action.payload.data.url;
        state.error = null;
      })
      .addCase(uploadAudio.rejected, (state, action) => {
        state.status = 'failed';
        state.audioUrl = null;
        state.error = action.payload || 'Upload failed.';
      })

      // Analyze Audio
      .addCase(analyzeAudio.pending, (state) => {
        state.status = 'analyzing';
        state.analysis = null;
        state.convertedAudio = null;
        state.error = null;
      })
      .addCase(analyzeAudio.fulfilled, (state, action) => {
        state.status = 'analyzed';
        state.analysis = action.payload.data.notes;
        state.error = null;
      })
      .addCase(analyzeAudio.rejected, (state, action) => {
        state.status = 'failed';
        state.analysis = null;
        state.convertedAudio = null;
        state.error = action.payload || 'Analysis failed.';
      })

      // Convert Audio
      .addCase(convertAudio.pending, (state) => {
        state.status = 'converting';
        state.convertedAudio = null;
        state.error = null;
      })
      .addCase(convertAudio.fulfilled, (state, action) => {
        const { url, cloudinaryPublicId, tempo, duration } = action.payload.data || {};
        if (!url) {
          state.status = 'failed';
          state.error = 'Invalid converted audio data received.';
        } else {
          state.status = 'converted';
          state.convertedAudio = { url, cloudinaryPublicId, tempo, duration };
        }
      })
      .addCase(convertAudio.rejected, (state, action) => {
        state.status = 'failed';
        state.convertedAudio = null;
        state.error = action.payload || 'Conversion failed.';
      });
  },
});

export const {
  setRecording,
  resetAudioState,
  setAudioUrl,
  setAnalysis,
  setAudioStatus,
  setConvertedAudio
} = audioSlice.actions;

export default audioSlice.reducer;
