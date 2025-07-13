import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import savedAudioService from '../../services/savedAudioService';

const initialState = {
  savedAudios: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// ─── Async Thunks ─────────────────────────────────────

// Save a converted audio
export const saveConvertedAudio = createAsyncThunk(
  'savedAudios/save',
  async (audioData, thunkAPI) => {
    try {
      return await savedAudioService.saveConvertedAudio(audioData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Save failed');
    }
  }
);

// Get all saved audios for the user
export const getSavedAudios = createAsyncThunk(
  'savedAudios/getAll',
  async (_, thunkAPI) => {
    try {
      return await savedAudioService.getSavedAudios();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Fetch failed');
    }
  }
);

// Update a saved audio
export const updateSavedAudio = createAsyncThunk(
  'savedAudios/update',
  async ({ audioId, newAudioData }, thunkAPI) => {
    try {
      return await savedAudioService.updateSavedAudio(audioId, newAudioData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Update failed');
    }
  }
);

// Delete a saved audio
export const deleteSavedAudio = createAsyncThunk(
  'savedAudios/delete',
  async (audioId, thunkAPI) => {
    try {
      await savedAudioService.deleteSavedAudio(audioId);
      return audioId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Delete failed');
    }
  }
);

// ─── Slice ────────────────────────────────────────────

export const savedAudioSlice = createSlice({
  name: 'savedAudios',
  initialState,
  reducers: {
    resetSavedAudioState: () => initialState,
    resetSavedAudioSuccess: (state) => {
      state.isSuccess = false;
      state.message = '';
    }
  },
  extraReducers: (builder) => {
    builder
      // Save
      .addCase(saveConvertedAudio.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(saveConvertedAudio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload.message || 'Audio saved successfully';
        state.savedAudios.push(action.payload.data);
      })
      .addCase(saveConvertedAudio.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Get All
      .addCase(getSavedAudios.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSavedAudios.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.savedAudios = action.payload.data;
      })
      .addCase(getSavedAudios.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.savedAudios = [];
      })

      // Update
      .addCase(updateSavedAudio.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateSavedAudio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = 'Audio updated successfully';
        state.savedAudios = state.savedAudios.map((audio) =>
          audio._id === action.payload.data._id ? action.payload.data : audio
        );
      })
      .addCase(updateSavedAudio.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Delete
      .addCase(deleteSavedAudio.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteSavedAudio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = 'Audio deleted successfully';
        state.savedAudios = state.savedAudios.filter(
          (audio) => audio._id !== action.payload
        );
      })
      .addCase(deleteSavedAudio.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetSavedAudioState, resetSavedAudioSuccess } = savedAudioSlice.actions;
export default savedAudioSlice.reducer;
