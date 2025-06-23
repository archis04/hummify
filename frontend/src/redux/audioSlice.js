import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const uploadAudio = createAsyncThunk('audio/upload', async (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob);
  
  const response = await fetch('/audio/upload', {
    method: 'POST',
    body: formData
  });
  return await response.json();
});

export const analyzeAudio = createAsyncThunk('audio/analyze', async (audioUrl) => {
  const response = await fetch('/audio/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioUrl })
  });
  return await response.json();
});

export const convertAudio = createAsyncThunk('audio/convert', async ({ instrument, notes }) => {
  const response = await fetch('/audio/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instrument, notes })
  });
  return await response.json();
});

const audioSlice = createSlice({
  name: 'audio',
  initialState: {
    recording: null,
    audioUrl: null,
    analysis: null,
    convertedAudio: null,
    status: 'idle',
    error: null
  },
  reducers: {
    setRecording: (state, action) => {
      state.recording = action.payload;
    },
    resetProcess: (state) => {
      state.audioUrl = null;
      state.analysis = null;
      state.convertedAudio = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadAudio.pending, (state) => {
        state.status = 'uploading';
      })
      .addCase(uploadAudio.fulfilled, (state, action) => {
        state.status = 'uploaded';
        state.audioUrl = action.payload.audioUrl;
      })
      .addCase(analyzeAudio.pending, (state) => {
        state.status = 'analyzing';
      })
      .addCase(analyzeAudio.fulfilled, (state, action) => {
        state.status = 'analyzed';
        state.analysis = action.payload;
      })
      .addCase(convertAudio.pending, (state) => {
        state.status = 'converting';
      })
      .addCase(convertAudio.fulfilled, (state, action) => {
        state.status = 'converted';
        state.convertedAudio = action.payload;
      })
      .addMatcher(
        action => action.type.endsWith('/rejected'),
        (state, action) => {
          state.status = 'failed';
          state.error = action.error.message;
        }
      );
  }
});

export const { setRecording, resetProcess } = audioSlice.actions;
export default audioSlice.reducer;