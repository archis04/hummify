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
    analysis: null, // This should only be set once by analyzeAudio.fulfilled
    convertedAudio: null, // This should only contain URL, publicId, tempo, duration
    status: 'idle', // 'idle', 'uploading', 'uploaded', 'analyzing', 'analyzed', 'converting', 'converted', 'failed'
    error: null
  },
  reducers: {
    setRecording: (state, action) => {
      state.recording = action.payload;
    },
    resetAudioState: (state) => {
      // This is the ONLY place that should completely reset analysis to null for a new hum
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
    // These reducers are generally for direct dispatch if needed, but not part of the primary thunk flow for initial setting
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
        state.error = action.payload || action.error.message || 'Upload failed.';
        state.audioUrl = null;
      })
      .addCase(analyzeAudio.pending, (state) => {
        state.status = 'analyzing';
        state.error = null;
        state.analysis = null; // Clear analysis while new analysis is pending
        state.convertedAudio = null; // Also clear converted audio if new analysis starts
      })
      .addCase(analyzeAudio.fulfilled, (state, action) => {
        state.status = 'analyzed';
        state.analysis = action.payload.data.notes; // This is the source of truth for initial analysis
        state.error = null;
      })
      .addCase(analyzeAudio.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message || 'Analysis failed.';
        state.analysis = null; // Clear analysis on failure
        state.convertedAudio = null; // Clear converted audio on failure
      })
      .addCase(convertAudio.pending, (state) => {
        state.status = 'converting';
        state.error = null;
        state.convertedAudio = null; // Clear previous converted audio during new conversion
        // IMPORTANT: DO NOT reset state.analysis here. We are re-converting based on existing analysis.
      })
      .addCase(convertAudio.fulfilled, (state, action) => {
        state.status = 'converted';
        if (action.payload && action.payload.data) {
            // FIX APPLIED HERE: Explicitly extract only the desired properties for convertedAudio
            // This prevents any 'notes' or 'analysis' data from the backend's convert response
            // from implicitly being assigned to state.convertedAudio and causing confusion.
            const { url, cloudinaryPublicId, tempo, duration } = action.payload.data;
            state.convertedAudio = { url, cloudinaryPublicId, tempo, duration };
        } else {
            console.error("convertAudio.fulfilled: Payload data structure is not as expected.", action.payload);
            state.error = "Invalid converted audio data received.";
            state.status = "failed";
        }
      })
      .addCase(convertAudio.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message || 'Conversion failed.';
        // IMPORTANT: DO NOT reset state.analysis here. Keep the original analysis even if conversion fails.
        state.convertedAudio = null; // Clear converted audio on failure
      });
      // Ensure there is NO generic addMatcher for all rejected actions here.
      // Specific rejections for each thunk are preferred.
  }
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