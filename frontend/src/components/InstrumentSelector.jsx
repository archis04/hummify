import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setInstrument } from '../redux/instrumentSlice';
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  Container,
  Card,
  CardContent
} from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

const InstrumentSelector = () => {
  const dispatch = useDispatch();
  const { instruments, selectedInstrument } = useSelector(state => state.instrument);
  const [open, setOpen] = React.useState(false);

  const handleChange = (event) => {
    dispatch(setInstrument(event.target.value));
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <Container maxWidth="sm">
      <Card sx={{ 
        p: 3, 
        mt: 5, 
        boxShadow: 3,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%)',
        borderRadius: '12px'
      }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 2
          }}>
            <MusicNoteIcon fontSize="large" color="primary" sx={{ fontSize: 60 }} />
            
            <Typography variant="h4" gutterBottom align="center" color="primary">
              Select Your Instrument
            </Typography>
            
            <Typography variant="body1" align="center" sx={{ mb: 3, color: 'text.secondary' }}>
              Choose from our collection of professional instruments
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="instrument-select-label">Instrument</InputLabel>
              <Select
                labelId="instrument-select-label"
                id="instrument-select"
                open={open}
                onClose={handleClose}
                onOpen={handleOpen}
                value={selectedInstrument}
                label="Instrument"
                onChange={handleChange}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {instruments.map((instrument) => (
                  <MenuItem key={instrument} value={instrument}>
                    {instrument}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1,
              mt: 1
            }}>
              <Typography variant="body2" color="text.secondary">
                Currently selected:
              </Typography>
              <Button 
                variant="outlined" 
                color="primary"
                size="small"
                sx={{ textTransform: 'none' }}
              >
                {selectedInstrument}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default InstrumentSelector;