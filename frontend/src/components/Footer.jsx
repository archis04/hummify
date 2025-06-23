import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => (
  <Box component="footer" sx={{ py: 3, bgcolor: 'background.paper', mt: 'auto' }}>
    <Typography variant="body2" color="text.secondary" align="center">
      © {new Date().getFullYear()} Hummify - Convert your hums to instrumentals
    </Typography>
  </Box>
);

export default Footer;