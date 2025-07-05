// frontend/src/components/Footer.js
import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box sx={{ py: 3, bgcolor: 'primary.main', color: 'white', textAlign: 'center', mt: 'auto' }}>
      <Typography variant="body2">
        © {new Date().getFullYear()} Hummify. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;