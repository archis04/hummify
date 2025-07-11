// src/pages/AnalysisResult.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { convertAudio, resetAudioState } from '../redux/audioSlice'; // Import resetAudioState
import { saveConvertedAudio, resetSavedAudioState } from '../redux/savedAudioSlice'; // Assuming resetSavedAudioState is in this slice
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, TextField, Card, CardContent, CircularProgress, IconButton, Checkbox, Tooltip, Dialog, DialogActions, DialogContent, DialogTitle
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MergeIcon from '@mui/icons-material/Merge';
import AudioPlayer from '../components/AudioPlayer';
import { toast } from 'react-toastify';


const AnalysisResult = () => {
  const dispatch = useDispatch();
  const { analysis, convertedAudio, status, message: audioMessage, error: audioError } = useSelector(state => state.audio);
  const { selectedInstrument } = useSelector(state => state.instrument);

  const { isLoading: saveLoading, isSuccess: saveSuccess, isError: saveError, message: saveMessage } = useSelector(
    (state) => state.savedAudios
  );

  const [editableNotes, setEditableNotes] = useState([]);
  const [audioName, setAudioName] = useState('');
  const [selectedNoteIndices, setSelectedNoteIndices] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // A ref to ensure initialization from 'analysis' happens only once per analysis,
  // NOT on every re-render or re-conversion
  const hasInitializedFromAnalysis = useRef(false);

  // --- Validation Helper Functions ---
  const isValidNoteName = (note) => {
    const normalizedNote = note.replace(/#/g, '♯');
    const validNoteRegex = /^[A-G](♯|b)?\d?$/i; 
    if (!validNoteRegex.test(normalizedNote)) return false;

    const notePartMatch = normalizedNote.match(/^[A-G](♯|b)?/i);
    const notePart = notePartMatch ? notePartMatch[0].toUpperCase() : '';
    const commonNotes = ['C', 'C♯', 'DB', 'D', 'D♯', 'EB', 'E', 'F', 'F♯', 'GB', 'G', 'G♯', 'AB', 'A', 'A♯', 'BB', 'B'];
    if (!commonNotes.includes(notePart) && !commonNotes.includes(notePart.replace('B', '♭').replace('S', '♯'))) return false;

    const octaveMatch = normalizedNote.match(/\d$/);
    if (octaveMatch) {
      const octave = parseInt(octaveMatch[0]);
      if (octave < 0 || octave > 9) return false;
    }
    return true;
  };

  const validateNoteParameter = useCallback((field, value, currentNote) => {
    const numValue = parseFloat(value);
    const EPSILON = 0.001; 

    if (isNaN(numValue)) {
      return false;
    }

    if (numValue < 0 && (field === 'start' || field === 'end' || field === 'duration')) {
      toast.error(`${field} must be non-negative.`);
      return false;
    }

    if (field === 'volume' && (numValue < 0 || numValue > 127)) {
      toast.error('Volume must be between 0 and 127 (MIDI velocity range).');
      return false;
    }

    if (field === 'end' && currentNote && numValue < currentNote.start - EPSILON) {
        toast.error('End time cannot be less than start time.');
        return false;
    }

    if (field === 'duration' && currentNote && numValue < 0) {
        toast.error('Duration cannot be negative.');
        return false;
    }

    return true;
  }, []);
   console.log("--- AnalysisResult Render ---");
   console.log("Redux audio.analysis:", JSON.parse(JSON.stringify(analysis))); // Deep copy to prevent mutation issues in log
   console.log("Component editableNotes state:", JSON.parse(JSON.stringify(editableNotes))); // Deep copy
   console.log("hasInitializedFromAnalysis.current:", hasInitializedFromAnalysis.current);
   console.log("Redux audio.status:", status);
   console.log("----------------------------");

  // --- Effects ---

  // EFFECT 1: Initialize editableNotes from Redux 'analysis' ONLY when 'analysis' first becomes available.
  useEffect(() => {
    console.log("Analysis Result - useEffect [analysis, hasInitializedFromAnalysis.current] Triggered.");
    console.log("  Current Analysis:", analysis);
    console.log("  hasInitializedFromAnalysis.current:", hasInitializedFromAnalysis.current);

    if (analysis && !hasInitializedFromAnalysis.current) {
      console.log("  Initializing editableNotes from new analysis data.");
      const normalizedAnalysis = analysis.map(note => ({
        ...note,
        note: note.note ? note.note.replace(/#/g, '♯') : ''
      }));
      setEditableNotes(normalizedAnalysis);
      setSelectedNoteIndices([]);
      hasInitializedFromAnalysis.current = true; // Mark as initialized
    } else if (!analysis && hasInitializedFromAnalysis.current) {
      // This path is for when analysis is explicitly cleared (e.g., by resetAudioState)
      console.log("  Analysis became null. Resetting component state.");
      hasInitializedFromAnalysis.current = false;
      setEditableNotes([]);
      setAudioName('');
      setSelectedNoteIndices([]);
    }
  }, [analysis]); // Depend only on 'analysis' to detect when a new analysis comes in or is cleared.

  // EFFECT 2: For save success/error feedback.
  useEffect(() => {
    if (saveSuccess) {
      toast.success(saveMessage || 'Audio saved successfully!');
      setAudioName('');
      dispatch(resetSavedAudioState()); // Reset save state
    }
    if (saveError) {
      toast.error(saveMessage);
      dispatch(resetSavedAudioState()); // Reset save state
    }
  }, [saveSuccess, saveError, saveMessage, dispatch]);

  // EFFECT 3: For audio conversion status feedback.
  useEffect(() => {
    if (audioError) {
      toast.error(audioError);
    } else if (status === 'converted' && convertedAudio) {
      toast.success(audioMessage || 'Audio converted successfully!');
    }
  }, [status, audioError, audioMessage, convertedAudio]);


  // --- Handlers for Note Editing (CRUD) ---
  const handleChange = useCallback((index, field, value) => {
    setEditableNotes(prevNotes => {
      const updatedNotes = [...prevNotes];
      let currentNote = { ...updatedNotes[index] };

      let processedValue = value;

      if (field === 'note') {
        processedValue = value.replace(/#/g, '♯');
        if (processedValue.trim() !== '' && !isValidNoteName(processedValue)) {
          currentNote[field] = value;
          updatedNotes[index] = currentNote;
          return updatedNotes;
        }
      }

      if (['start', 'end', 'duration', 'volume'].includes(field)) {
        if (!validateNoteParameter(field, processedValue, currentNote)) {
            currentNote[field] = value;
            updatedNotes[index] = currentNote;
            return updatedNotes;
        }
      }

      currentNote[field] = processedValue;

      const start = parseFloat(currentNote.start);
      const end = parseFloat(currentNote.end);
      const duration = parseFloat(currentNote.duration);
      const EPSILON = 0.001;

      if (field === 'start' || field === 'end') {
        if (!isNaN(start) && !isNaN(end)) {
          if (end >= start - EPSILON) {
            currentNote.duration = parseFloat((end - start).toFixed(3));
          } else {
            toast.warn('End time cannot be significantly less than start time. Duration set to 0.');
            currentNote.duration = 0;
            currentNote.end = currentNote.start;
          }
        }
      } else if (field === 'duration') {
        if (!isNaN(start) && !isNaN(duration) && duration >= -EPSILON) {
          currentNote.end = parseFloat((start + duration).toFixed(3));
        } else if (duration < 0) {
            toast.warn('Duration cannot be negative. Setting to 0 and adjusting end time.');
            currentNote.duration = 0;
            currentNote.end = currentNote.start;
        }
      }

      updatedNotes[index] = currentNote;
      return updatedNotes;
    });
  }, [isValidNoteName, validateNoteParameter]);


  const handleAddNote = useCallback((insertIndex) => {
    setEditableNotes(prevNotes => {
      let newNote;
      let notificationMessage = 'New note added. Please adjust its parameters.';

      if (insertIndex === undefined || insertIndex === prevNotes.length) {
        const lastNote = prevNotes[prevNotes.length - 1];
        const newStartTime = lastNote ? parseFloat((lastNote.end + 0.1).toFixed(3)) : 0.0;
        newNote = {
          note: 'C4',
          start: newStartTime,
          end: parseFloat((newStartTime + 1.0).toFixed(3)),
          duration: 1.0,
          volume: 80,
        };
        notificationMessage = 'New note added to the end. Please adjust its parameters.';
        return [...prevNotes, newNote];
      } else {
        const previousNote = prevNotes[insertIndex - 1];
        const nextNote = prevNotes[insertIndex];

        let newStartTime = 0;
        let newEndTime = 1;
        let newDuration = 1;

        const MIN_DURATION = 0.05;

        if (previousNote && nextNote) {
          newStartTime = parseFloat(((previousNote.end + nextNote.start) / 2).toFixed(3));
          newEndTime = parseFloat((newStartTime + 1.0).toFixed(3));

          if (newEndTime > nextNote.start) {
              newEndTime = nextNote.start;
              newDuration = parseFloat((newEndTime - newStartTime).toFixed(3));
              if (newDuration < MIN_DURATION) {
                  newStartTime = previousNote.end;
                  newDuration = MIN_DURATION;
                  newEndTime = parseFloat((newStartTime + newDuration).toFixed(3));
                  if (newEndTime > nextNote.start) {
                      newEndTime = nextNote.start;
                      newDuration = parseFloat((newEndTime - newStartTime).toFixed(3));
                      if (newDuration < 0) newDuration = 0;
                  }
              }
          }
        } else if (previousNote) {
          newStartTime = parseFloat((previousNote.end + 0.1).toFixed(3));
          newEndTime = parseFloat((newStartTime + 1.0).toFixed(3));
        } else if (nextNote) {
          newEndTime = parseFloat((nextNote.start - 0.1).toFixed(3));
          newStartTime = parseFloat((newEndTime - 1.0).toFixed(3));
          if (newStartTime < 0) newStartTime = 0;
          newDuration = parseFloat((newEndTime - newStartTime).toFixed(3));
          if (newDuration < MIN_DURATION) {
              newDuration = MIN_DURATION;
              newStartTime = parseFloat((newEndTime - newDuration).toFixed(3));
              if (newStartTime < 0) newStartTime = 0;
          }
        }

        newNote = {
          note: 'C4',
          start: newStartTime,
          end: newEndTime,
          duration: newDuration,
          volume: 80,
        };

        const updatedNotes = [...prevNotes];
        updatedNotes.splice(insertIndex, 0, newNote);
        notificationMessage = `New note added at position ${insertIndex + 1}. Please adjust its parameters.`;
        return updatedNotes;
      }
    });
    toast.info(notificationMessage);
  }, []);

  const handleDeleteNote = (indexToDelete) => {
    if (indexToDelete !== undefined) {
      setSelectedNoteIndices([indexToDelete]);
    }
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setEditableNotes(prevNotes =>
      prevNotes.filter((_, index) => !selectedNoteIndices.includes(index))
    );
    setSelectedNoteIndices([]);
    setDeleteConfirmOpen(false);
    toast.success('Note(s) deleted successfully!');
  };

  const handleCancelDelete = () => {
    setSelectedNoteIndices([]);
    setDeleteConfirmOpen(false);
  };

  const handleToggleSelectNote = (index) => {
    setSelectedNoteIndices(prevSelected => {
      if (prevSelected.includes(index)) {
        return prevSelected.filter(i => i !== index);
      } else {
        return [...prevSelected, index];
      }
    });
  };

  const handleCombineSelectedNotes = () => {
    if (selectedNoteIndices.length < 2) {
      toast.error('Please select at least two notes to combine.');
      return;
    }

    const selectedNotes = selectedNoteIndices
      .map(index => editableNotes[index])
      .sort((a, b) => a.start - b.start);

    const firstNote = selectedNotes[0];
    const lastNote = selectedNotes[selectedNotes.length - 1];

    const newStart = parseFloat(firstNote.start);
    const newEnd = parseFloat(lastNote.end);
    const newDuration = parseFloat((newEnd - newStart).toFixed(3));
    const newVolume = parseFloat((selectedNotes.reduce((sum, note) => sum + note.volume, 0) / selectedNotes.length).toFixed(0));

    if (newDuration < 0) {
      toast.error("Cannot combine notes resulting in a negative duration. Please check their start and end times.");
      return;
    }

    const combinedNote = {
      note: firstNote.note,
      start: newStart,
      end: newEnd,
      duration: newDuration,
      volume: newVolume,
    };

    setEditableNotes(prevNotes => {
      const filteredNotes = prevNotes.filter((_, index) => !selectedNoteIndices.includes(index));

      const insertionIndex = filteredNotes.findIndex(note => note.start > combinedNote.start);
      if (insertionIndex === -1) {
        return [...filteredNotes, combinedNote];
      } else {
        return [
          ...filteredNotes.slice(0, insertionIndex),
          combinedNote,
          ...filteredNotes.slice(insertionIndex),
        ];
      }
    });

    setSelectedNoteIndices([]);
    toast.success('Notes combined successfully!');
  };


  // --- Other Action Handlers ---
  const handleReconvert = () => {
    if (editableNotes.length === 0) {
      toast.error('Cannot re-convert with no notes. Please add some notes.');
      return;
    }

    const allNotesValid = editableNotes.every((note, index) => {
      if (!isValidNoteName(note.note)) {
        toast.error(`Invalid note name "${note.note}" at row ${index + 1}. Please correct.`);
        return false;
      }
      if (!validateNoteParameter('start', note.start, note) ||
          !validateNoteParameter('end', note.end, note) ||
          !validateNoteParameter('duration', note.duration, note) ||
          !validateNoteParameter('volume', note.volume, note)) {
        toast.error(`Invalid numeric data for note at row ${index + 1}. Please correct.`);
        return false;
      }

      const calculatedDuration = parseFloat((note.end - note.start).toFixed(3));
      const EPSILON_FINAL_CHECK = 0.005;
      if (Math.abs(note.duration - calculatedDuration) > EPSILON_FINAL_CHECK) {
          toast.warn(`Duration mismatch for note at row ${index + 1}. Correcting duration from ${note.duration} to ${calculatedDuration}.`);
          note.duration = calculatedDuration;
      }
      return true;
    });

    if (!allNotesValid) {
      toast.error('Please fix all validation errors before re-converting your track.');
      return;
    }

    const notesForBackend = editableNotes.map(note => ({
      ...note,
      note: note.note.replace(/♯/g, '#')
    }));

    dispatch(convertAudio({
      instrument: selectedInstrument,
      notes: notesForBackend
    }));
  };

  const handleSaveAudio = () => {
    if (!audioName.trim()) {
      toast.error('Please enter a name for your audio before saving.');
      return;
    }

    if (convertedAudio && editableNotes.length > 0) {
      const notesToSave = editableNotes.map(note => ({
        ...note,
        note: note.note.replace(/♯/g, '#')
      }));

      const dataToSave = {
        name: audioName,
        convertedAudioUrl: convertedAudio.url,
        cloudinaryPublicId: convertedAudio.cloudinaryPublicId, 
        instrument: selectedInstrument,
        notes: notesToSave,
        tempo: convertedAudio.tempo,
        duration: convertedAudio.duration,
      };
      console.log("Dispatching saveConvertedAudio with:", dataToSave);
      dispatch(saveConvertedAudio(dataToSave));
    } else {
      toast.error('No converted audio data to save. Please convert a hum first.');
    }
  };

  const isConverting = status === 'converting';
  const displayResults = analysis || convertedAudio || status === 'analyzing' || status === 'converted';

  if (!displayResults && status !== 'analyzing') {
    return (
      <Card sx={{ p: 3, mt: 4, boxShadow: 3, borderRadius: '12px', background: 'linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%)' }}>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            Analysis results will appear here after processing your hum.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{
      p: 3,
      mt: 4,
      boxShadow: 3,
      background: 'linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%)',
      borderRadius: '12px'
    }}>
      <CardContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h5" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
            Detailed Analysis
          </Typography>

          {status === 'analyzing' && (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ my: 4 }}>
              <CircularProgress />
              <Typography variant="h6" sx={{ mt: 2 }}>Analyzing your hum...</Typography>
            </Box>
          )}

          {analysis && ( // Render table only if initial analysis is available
            <Box>
              <Box sx={{ mb: 2, display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    color="info"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddNote(editableNotes.length)}
                    disabled={isConverting}
                    sx={{minWidth: '150px'}}
                  >
                    Add Note (End)
                  </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteNote()}
                  disabled={selectedNoteIndices.length === 0 || isConverting}
                  sx={{minWidth: '150px'}}
                >
                  Delete Selected ({selectedNoteIndices.length})
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<MergeIcon />}
                  onClick={handleCombineSelectedNotes}
                  disabled={selectedNoteIndices.length < 2 || isConverting}
                  sx={{minWidth: '150px'}}
                >
                  Combine Selected ({selectedNoteIndices.length})
                </Button>
              </Box>

              <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 400, overflowY: 'auto', border: '1px solid #e0e0e0' }}>
                <Table stickyHeader size="small">
                  <TableHead sx={{ backgroundColor: '#e8f5e9' }}>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Tooltip title="Select/Deselect Note">
                            <Checkbox disabled={true} />
                        </Tooltip>
                      </TableCell>
                      <TableCell>Note</TableCell>
                      <TableCell>Start (s)</TableCell>
                      <TableCell>End (s)</TableCell>
                      <TableCell>Duration (s)</TableCell>
                      <TableCell>Volume</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {editableNotes.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                No notes to display. Use "Add Note (End)" or hum into the microphone!
                            </TableCell>
                        </TableRow>
                    )}
                    {editableNotes.map((note, index) => (
                      <React.Fragment key={index}>
                        <TableRow
                          selected={selectedNoteIndices.includes(index)}
                          sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedNoteIndices.includes(index)}
                              onChange={() => handleToggleSelectNote(index)}
                              disabled={isConverting}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={note.note || ''}
                              onChange={(e) => handleChange(index, 'note', e.target.value)}
                              size="small"
                              sx={{ maxWidth: 90 }}
                              error={!!note.note && !isValidNoteName(note.note.replace(/#/g, '♯'))}
                              helperText={!!note.note && !isValidNoteName(note.note.replace(/#/g, '♯')) ? 'Invalid note' : ''}
                              disabled={isConverting}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={note.start || ''}
                              onChange={(e) => handleChange(index, 'start', parseFloat(e.target.value))}
                              size="small"
                              sx={{ maxWidth: 80 }}
                              inputProps={{ step: "0.01" }}
                              error={note.start < 0 || (note.end !== undefined && note.end < note.start - 0.001)} 
                              disabled={isConverting}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={note.end || ''}
                              onChange={(e) => handleChange(index, 'end', parseFloat(e.target.value))}
                              size="small"
                              sx={{ maxWidth: 80 }}
                              inputProps={{ step: "0.01" }}
                              error={note.end < 0 || (note.start !== undefined && note.end < note.start - 0.001)} 
                              disabled={isConverting}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={note.duration || ''}
                              onChange={(e) => handleChange(index, 'duration', parseFloat(e.target.value))}
                              size="small"
                              sx={{ maxWidth: 90 }}
                              inputProps={{ step: "0.01" }}
                              error={note.duration < -0.001} 
                              disabled={isConverting}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={note.volume || ''}
                              onChange={(e) => handleChange(index, 'volume', parseInt(e.target.value))}
                              size="small"
                              sx={{ maxWidth: 80 }}
                              inputProps={{ min: 0, max: 127 }}
                              error={note.volume < 0 || note.volume > 127}
                              disabled={isConverting}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Delete This Note">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDeleteNote(index)}
                                disabled={isConverting}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Add Note After This">
                                <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() => handleAddNote(index + 1)}
                                    disabled={isConverting}
                                    sx={{ml: 0.5}}
                                >
                                    <AddIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          <Button
            variant="contained"
            color="secondary"
            startIcon={<ReplayIcon />}
            onClick={handleReconvert}
            sx={{ mr: 2, mt: 2 }}
            disabled={isConverting || editableNotes.length === 0}
          >
            {isConverting ? 'Re-converting...' : 'Re-convert with Changes'}
          </Button>

          {convertedAudio && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Your Converted Track:
              </Typography>
              <AudioPlayer src={convertedAudio.url} title={`Converted to ${selectedInstrument}`} />
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                Duration: {convertedAudio.duration ? convertedAudio.duration.toFixed(2) : 'N/A'}s
              </Typography>

              <Box sx={{ mt: 4, p: 3, border: '1px solid #ccc', borderRadius: '8px', background: '#f0f0f0' }}>
                <Typography variant="h6" gutterBottom>
                  Save Converted Audio
                </Typography>
                <TextField
                  label="Audio Name"
                  variant="outlined"
                  size="small"
                  value={audioName}
                  onChange={(e) => setAudioName(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  disabled={saveLoading}
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={saveLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveAudio}
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving...' : 'Save Audio'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>

      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
        <DialogContent>
          <Typography id="alert-dialog-description">
            Are you sure you want to delete the selected {selectedNoteIndices.length} note(s)? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary" disabled={isConverting}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus disabled={isConverting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default AnalysisResult;