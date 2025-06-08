// frontend/src/features/audio/audioSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { uploadAudioFile,deleteAudioById,fetchAllAudios } from "../api/audioApi";

// Thunks
export const uploadAudio = createAsyncThunk(
  "audio/uploadAudio",
  async (formData, thunkAPI) => {
    try {
      const response = await uploadAudioFile(formData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const getAudios = createAsyncThunk(
  "audio/getAudios",
  async (_, thunkAPI) => {
    try {
      const response = await fetchAllAudios();
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const deleteAudio = createAsyncThunk(
  "audio/deleteAudio",
  async (id, thunkAPI) => {
    try {
      await deleteAudioById(id);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

const audioSlice = createSlice({
  name: "audio",
  initialState: {
    audios: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Upload
    builder
      .addCase(uploadAudio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadAudio.fulfilled, (state, action) => {
        state.loading = false;
        state.audios.unshift(action.payload); // add to front
      })
      .addCase(uploadAudio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Upload failed";
      });

    // Fetch
    builder
      .addCase(getAudios.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAudios.fulfilled, (state, action) => {
        state.loading = false;
        state.audios = action.payload;
      })
      .addCase(getAudios.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Fetch failed";
      });

    // Delete
    builder
      .addCase(deleteAudio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAudio.fulfilled, (state, action) => {
        state.loading = false;
        state.audios = state.audios.filter(
          (audio) => audio._id !== action.payload
        );
      })
      .addCase(deleteAudio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Delete failed";
      });
  },
});

export default audioSlice.reducer;
