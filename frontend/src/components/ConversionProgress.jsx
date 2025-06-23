import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, LinearProgress, Card, CardContent, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';

const ConversionProgress = () => {
  const { status } = useSelector(state => state.audio);
  const { selectedInstrument } = useSelector(state => state.instrument);

  const statusMessages = {
    uploading: 'Uploading your audio...',
    analyzing: 'Analyzing musical notes...',
    converting: `Converting to ${selectedInstrument}...`,
    converted: 'Conversion complete!',
    failed: 'Conversion failed'
  };

  const statusIcons = {
    uploading: <AudiotrackIcon fontSize="large" />,
    analyzing: <CircularProgress size={24} />,
    converting: <CircularProgress size={24} />,
    converted: <CheckCircleIcon fontSize="large" color="success" />,
    failed: <span>❌</span>
  };

  return (
     <Card sx={{ 
    p: 3, 
    mt: 3, 
    boxShadow: 3,
    background: 'linear-gradient(135deg, #e0f7fa 0%, #bbdefb 100%)',
    borderRadius: '12px'
  }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {statusIcons[status]}
          <Typography variant="h6">
            {statusMessages[status]}
          </Typography>
        </Box>
        
        {status !== 'converted' && status !== 'failed' && (
          <LinearProgress sx={{ mt: 2, height: 10, borderRadius: 5 }} />
        )}
      </CardContent>
    </Card>
  );
};

export default ConversionProgress;