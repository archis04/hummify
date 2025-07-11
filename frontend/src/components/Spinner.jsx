// frontend/src/components/Spinner.jsx
import React from 'react';
import { CircularProgress, Box } from '@mui/material';

const Spinner = () => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <CircularProgress />
    </Box>
  );
};

export default Spinner;