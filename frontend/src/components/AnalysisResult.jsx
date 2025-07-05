import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { convertAudio } from '../redux/audioSlice';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Card, CardContent } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import AudioPlayer from './AudioPlayer'; // Import the new player


const AnalysisResult = () => {
  const dispatch = useDispatch();
  const { analysis, convertedAudio, status } = useSelector(state => state.audio);
  const { selectedInstrument } = useSelector(state => state.instrument);
  // Initialize editableNotes with analysis data when component mounts or analysis changes
  const [editableNotes, setEditableNotes] = useState(analysis || []);

  // Update editableNotes if the Redux 'analysis' state changes (e.g., on first analysis)
  useEffect(() => {
    if (analysis) {
      setEditableNotes(analysis);
    }
  }, [analysis]);

  const handleChange = (index, field, value) => {
    const updatedNotes = [...editableNotes];
    updatedNotes[index] = { ...updatedNotes[index], [field]: value };
    setEditableNotes(updatedNotes);
  };

  const handleReconvert = () => {
    dispatch(convertAudio({
      instrument: selectedInstrument,
      notes: editableNotes
    }));
  };

  if (!analysis && status !== 'analyzed' && status !== 'converted') {
    return (
      <Card sx={{ p: 3, mt: 4, boxShadow: 3, borderRadius: '12px', background: 'linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%)' }}>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            Analysis results will appear here after processing.
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
        <Box sx={{ mt: 2 }}> {/* Reduced mt from 4 to 2 for tighter spacing */}
          <Typography variant="h5" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
            Detailed Analysis
          </Typography>

          <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 400, overflowY: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Note</TableCell>
                  <TableCell>Start (s)</TableCell>
                  <TableCell>End (s)</TableCell>
                  <TableCell>Duration (s)</TableCell>
                  <TableCell>Volume</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {editableNotes.map((note, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        value={note.note || ''}
                        onChange={(e) => handleChange(index, 'note', e.target.value)}
                        size="small"
                        sx={{ maxWidth: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={note.start || ''}
                        onChange={(e) => handleChange(index, 'start', parseFloat(e.target.value))}
                        size="small"
                        sx={{ maxWidth: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={note.end || ''}
                        onChange={(e) => handleChange(index, 'end', parseFloat(e.target.value))}
                        size="small"
                        sx={{ maxWidth: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={note.duration || ''}
                        onChange={(e) => handleChange(index, 'duration', parseFloat(e.target.value))}
                        size="small"
                        sx={{ maxWidth: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={note.volume || ''}
                        onChange={(e) => handleChange(index, 'volume', parseInt(e.target.value))}
                        size="small"
                        sx={{ maxWidth: 80 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<ReplayIcon />}
            onClick={handleReconvert}
            sx={{ mr: 2 }}
            disabled={status === 'converting'} // Disable during reconversion
          >
            {status === 'converting' ? 'Re-converting...' : 'Re-convert with Changes'}
          </Button>

          {convertedAudio && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Your Converted Track:
              </Typography>
              <AudioPlayer src={convertedAudio.url} title={`Converted to ${selectedInstrument}`} />
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                Tempo: {convertedAudio.tempo} BPM | Duration: {convertedAudio.duration ? convertedAudio.duration.toFixed(2) : 'N/A'}s
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AnalysisResult;