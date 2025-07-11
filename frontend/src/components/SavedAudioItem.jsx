// src/components/SavedAudioItem.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteSavedAudio, updateSavedAudio } from '../redux/savedAudioSlice.js';
// Import `useNavigate` from react-router-dom
import { useNavigate } from 'react-router-dom';
import {
  Card, CardContent, Typography, Button, IconButton, TextField, Box, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'; // Removed Select, MenuItem, InputLabel, FormControl as they are for edit details dialog
import PlayArrowIcon from '@mui/icons-material/PlayArrow'; // Keep if AudioPlayer uses it, otherwise can remove
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
// Removed VisibilityIcon as it was for viewing/editing notes
import CloseIcon from '@mui/icons-material/Close'; // Keep if used elsewhere, otherwise can remove
import { toast } from 'react-toastify';
import AudioPlayer from './AudioPlayer.jsx';

const SavedAudioItem = ({ audio }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Initialize useNavigate hook - Keep for potential future use or if other navigation happens

  const { isLoading: saveLoading } = useSelector(state => state.savedAudios);
  // Removed: const { instruments } = useSelector(state => state.instrument); // Not needed without instrument editing

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(audio.name);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Removed: New states for editing instrument and notes
  // const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  // const [editedInstrument, setEditedInstrument] = useState(audio.instrument);

  const handleDeleteClick = () => {
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    dispatch(deleteSavedAudio(audio._id));
    toast.info(`Deleting "${audio.name}"...`);
    setConfirmDeleteOpen(false);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
  };

  const handleRenameSave = () => {
    if (newName.trim() === '' || newName === audio.name) {
      setIsEditingName(false);
      return;
    }
    dispatch(updateSavedAudio({ audioId: audio._id, newAudioData: { name: newName } }));
    setIsEditingName(false);
    toast.info(`Renaming "${audio.name}" to "${newName}"...`);
  };

  // Removed: --- New Handlers for Edit Details Dialog ---
  // const handleOpenEditDetails = () => {
  //   setEditedInstrument(audio.instrument); // Ensure current instrument is loaded
  //   setEditDetailsOpen(true);
  // };

  // const handleCloseEditDetails = () => {
  //   setEditDetailsOpen(false);
  // };

  // const handleSaveEditedDetails = () => {
  //   // Only update if the instrument has changed
  //   if (editedInstrument !== audio.instrument) {
  //     dispatch(updateSavedAudio({ audioId: audio._id, newAudioData: { instrument: editedInstrument } }));
  //     toast.success(`Instrument for "${audio.name}" updated to ${editedInstrument}.`);
  //   } else {
  //     toast.info("No changes to save for instrument.");
  //   }
  //   setEditDetailsOpen(false);
  // };

  // const handleEditNotes = () => {
  //   // Navigate to the main analysis page (or a dedicated edit page)
  //   // and pass the saved audio's notes and instrument via state.
  //   navigate('/', {
  //     state: {
  //       notes: audio.notes,
  //       instrument: audio.instrument,
  //       originalAudioName: audio.name,
  //       originalAudioId: audio._id,
  //       isReEdit: true // Flag to indicate this is a re-edit flow
  //     }
  //   });
  //   setEditDetailsOpen(false); // Close the dialog
  //   toast.info("Loading notes for full editing...");
  // };


  return (
    <Card sx={{
      display: 'flex', flexDirection: 'column', p: 2, mb: 3, boxShadow: 3, borderRadius: '12px',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
    }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          {isEditingName ? (
            <TextField
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRenameSave}
              onKeyPress={(e) => { if (e.key === 'Enter') handleRenameSave(); }}
              variant="standard"
              size="small"
              fullWidth
              autoFocus
              sx={{ '.MuiInput-underline:after': { borderBottomColor: 'primary.main' } }}
            />
          ) : (
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
              {audio.name}
            </Typography>
          )}
          <Tooltip title="Rename Audio">
            <IconButton onClick={() => setIsEditingName(!isEditingName)} size="small" color="primary" disabled={saveLoading}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Instrument: **{audio.instrument}**
        </Typography>
        {/* Removed: Tempo Display */}
        {/*
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Tempo: **{audio.tempo}** BPM
        </Typography>
        */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Duration: **{audio.duration ? audio.duration.toFixed(2) : 'N/A'}**s
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AudioPlayer src={audio.convertedAudioUrl} title={`Play ${audio.name}`} />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          {/* Removed: Edit Details Button */}
          {/*
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<VisibilityIcon />}
            onClick={handleOpenEditDetails}
            disabled={saveLoading}
            sx={{ flexGrow: 1 }}
          >
            Edit Details
          </Button>
          */}
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
            disabled={saveLoading}
            sx={{ flexGrow: 1 }}
          >
            Delete
          </Button>
        </Box>
      </CardContent>

      {/* Confirmation Dialog for Deletion */}
      <Dialog open={confirmDeleteOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete "{audio.name}"?</Typography>
          <Typography variant="body2" color="text.secondary">This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary" disabled={saveLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={saveLoading}>
            {saveLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Removed: New: Edit Details Dialog */}
      {/*
      <Dialog open={editDetailsOpen} onClose={handleCloseEditDetails} fullWidth maxWidth="sm">
        <DialogTitle>
          Edit Audio Details
          <IconButton
            aria-label="close"
            onClick={handleCloseEditDetails}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="instrument-select-label">Instrument</InputLabel>
            <Select
              labelId="instrument-select-label"
              id="instrument-select"
              value={editedInstrument}
              label="Instrument"
              onChange={(e) => setEditedInstrument(e.target.value)}
              disabled={saveLoading}
            >
              {instruments.map((inst) => (
                <MenuItem key={inst} value={inst}>{inst}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Notes Analysis (Read-Only Preview)
          </Typography>
          <Box sx={{ maxHeight: 200, overflowY: 'auto', p: 1, border: '1px solid #e0e0e0', borderRadius: '4px', background: '#f8f8f8' }}>
            {audio.notes && audio.notes.length > 0 ? (
              audio.notes.map((note, idx) => (
                <Typography key={idx} variant="body2" sx={{ mb: 0.5, lineHeight: 1.2 }}>
                  **{note.note}** from {note.start.toFixed(2)}s to {note.end.toFixed(2)}s (Vol: {note.volume})
                </Typography>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">No notes data available.</Typography>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            For full note editing (add, delete, combine notes), click "Edit Full Analysis".
          </Typography>

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDetails} color="secondary" disabled={saveLoading}>
            Cancel
          </Button>
          <Button onClick={handleEditNotes} color="info" variant="outlined" startIcon={<EditIcon />} disabled={saveLoading}>
            Edit Full Analysis
          </Button>
          <Button onClick={handleSaveEditedDetails} color="primary" variant="contained" disabled={saveLoading || editedInstrument === audio.instrument}>
            Save Instrument
          </Button>
        </DialogActions>
      </Dialog>
      */}
    </Card>
  );
};

export default SavedAudioItem;