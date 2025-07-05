// frontend/src/redux/audioSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Helper function to extract error message from an HTTP response
const getErrorMessage = async (response) => {
  try {
    const errorData = await response.json();
    // Assuming your backend sends errors in a consistent format like { error: "message" }
    return errorData.error || response.statusText || 'An unknown error occurred.';
  } catch (e) {
    // If response body is not JSON or other parsing error
    return response.statusText || 'An unknown error occurred.';
  }
};

export const uploadAudio = createAsyncThunk(
  'audio/upload',
  async (audioBlob, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorMessage = await getErrorMessage(response);
        return rejectWithValue(errorMessage);
      }

      return await response.json();
    } catch (networkError) {
      return rejectWithValue(networkError.message || 'Network error occurred during upload.');
    }
  }
);

export const analyzeAudio = createAsyncThunk(
  'audio/analyze',
  async (audioUrl, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/audio/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl })
      });

      if (!response.ok) {
        const errorMessage = await getErrorMessage(response);
        return rejectWithValue(errorMessage);
      }

      return await response.json();
    } catch (networkError) {
      return rejectWithValue(networkError.message || 'Network error occurred during analysis.');
    }
  }
);

export const convertAudio = createAsyncThunk(
  'audio/convert',
  async ({ instrument, notes }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/audio/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instrument, notes })
      });

      if (!response.ok) {
        const errorMessage = await getErrorMessage(response);
        return rejectWithValue(errorMessage);
      }

      return await response.json();
    } catch (networkError) {
      return rejectWithValue(networkError.message || 'Network error occurred during conversion.');
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
    status: 'idle',
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
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadAudio.pending, (state) => {
        state.status = 'uploading';
        state.error = null;
      })
      .addCase(uploadAudio.fulfilled, (state, action) => {
        state.status = 'uploaded';
        // FIX: Access action.payload.data.url as backend returns { success: true, data: { url: ... } }
        state.audioUrl = action.payload.data.url;
        state.error = null;
      })
      .addCase(analyzeAudio.pending, (state) => {
        state.status = 'analyzing';
        state.error = null;
      })
      .addCase(analyzeAudio.fulfilled, (state, action) => {
        state.status = 'analyzed';
        // FIX: Access action.payload.data.notes as backend returns { success: true, data: { notes: [...] } }
        // Assuming the `result` from runPython is directly the notes array or object with notes.
        // If `result` itself is `[{note: 'C4', ...}]`, then `action.payload.data` will be `[{note: 'C4', ...}]`.
        // In that specific case, it would be `state.analysis = action.payload.data;`.
        // However, based on the context of 'analysis' usually containing a 'notes' field,
        // `action.payload.data.notes` is the more common and safer assumption for structured data.
        // If your Python script's output (returned by `runPython`) is just the notes array,
        // and that's what's put into `data`, then `action.payload.data` itself *is* the notes.
        // For now, assuming `data: { notes: [...] }`
        state.analysis = action.payload.data.notes;
        state.error = null;
      })
      .addCase(convertAudio.pending, (state) => {
        state.status = 'converting';
        state.error = null;
        state.convertedAudio = null
      })
      .addCase(convertAudio.fulfilled, (state, action) => {
        state.status = 'converted';
        // IMPORTANT: action.payload is the entire response.data from the axios call.
        // This response.data contains a 'data' property which holds the actual converted audio info.
        // So, we need to assign action.payload.data to state.convertedAudio.
        if (action.payload && action.payload.data) {
          state.convertedAudio = action.payload.data;
        } else {
          // Fallback or error handling if the payload structure is unexpected
          console.error("convertAudio.fulfilled: Payload data structure is not as expected.", action.payload);
          state.error = "Invalid converted audio data received.";
          state.status = "failed";
        }
      })
      .addMatcher(
        action => action.type.endsWith('/rejected'),
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload || action.error.message || 'An unknown error occurred.';
          state.audioUrl = null;
          state.analysis = null;
          state.convertedAudio = null;
        }
      );
  }
});

export const { setRecording, resetAudioState, setAudioUrl } = audioSlice.actions;
export default audioSlice.reducer;