import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { convertAudio } from '../redux/audioSlice';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';

const AnalysisResult = () => {
  const dispatch = useDispatch();
  const { analysis, convertedAudio } = useSelector(state => state.audio);
  const { selectedInstrument } = useSelector(state => state.instrument);
  const [editableNotes, setEditableNotes] = useState(analysis);

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

  return (
    <Card sx={{ 
    p: 3, 
    mt: 4, 
    boxShadow: 3,
    background: 'linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%)',
    borderRadius: '12px'
  }}>
    <CardContent>
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom color="primary">
        Detailed Analysis
      </Typography>
      
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
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
                    value={note.note}
                    onChange={(e) => handleChange(index, 'note', e.target.value)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    value={note.start}
                    onChange={(e) => handleChange(index, 'start', parseFloat(e.target.value))}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    value={note.end}
                    onChange={(e) => handleChange(index, 'end', parseFloat(e.target.value))}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    value={note.duration}
                    onChange={(e) => handleChange(index, 'duration', parseFloat(e.target.value))}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    value={note.volume}
                    onChange={(e) => handleChange(index, 'volume', parseInt(e.target.value))}
                    size="small"
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
      >
        Re-convert with Changes
      </Button>

      {convertedAudio && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Converted Audio:
          </Typography>
          <audio controls src={convertedAudio.url} style={{ width: '100%' }} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Tempo: {convertedAudio.tempo} BPM | Duration: {convertedAudio.duration.toFixed(2)}s
          </Typography>
        </Box>
      )}
    </Box>
      </CardContent>
  </Card>
  );
};

export default AnalysisResult;