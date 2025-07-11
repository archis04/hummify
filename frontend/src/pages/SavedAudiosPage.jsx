// src/pages/SavedAudiosPage.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getSavedAudios, resetSavedAudioState } from '../redux/savedAudioSlice.js';
import SavedAudioItem from '../components/SavedAudioItem'; // Your new component
import {
  Box, Typography, CircularProgress, Grid, Alert, Container
} from '@mui/material';
import { toast } from 'react-toastify'; // For notifications

const SavedAudiosPage = () => {
  const dispatch = useDispatch();
  const { savedAudios, isLoading, isError, message } = useSelector(
    (state) => state.savedAudios
  );

  useEffect(() => {
    // Reset state on mount to clear previous errors/successes
    dispatch(resetSavedAudioState());
    // Fetch saved audios when the component mounts
    dispatch(getSavedAudios());

    // Optional: Clean up state on unmount if you don't want old data lingering
    return () => {
      dispatch(resetSavedAudioState());
    };
  }, [dispatch]); // Dependency array: run once on mount, and if dispatch changes (rarely)

  useEffect(() => {
    if (isError) {
      toast.error(message || 'Failed to load saved audios.');
      console.error("Error fetching saved audios:", message);
    }
  }, [isError, message]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading saved audios...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 4 }}>
        My Saved Audios
      </Typography>

      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {message || 'An error occurred while fetching your saved audios.'}
        </Alert>
      )}

      {savedAudios.length > 0 ? (
        <Grid container spacing={3}>
          {savedAudios.map((audio) => (
            <Grid item xs={12} sm={6} md={4} key={audio._id}>
              <SavedAudioItem audio={audio} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', p: 3, borderRadius: '12px', border: '1px dashed #ccc' }}>
          <Typography variant="h6" color="text.secondary" align="center">
            You haven't saved any audios yet.
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Go convert a hum and save your masterpiece!
          </Typography>
          {/* Optionally add a button to navigate to the conversion page */}
        </Box>
      )}
    </Container>
  );
};

export default SavedAudiosPage;