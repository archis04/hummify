import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

const Header = ({ onReset }) => (
  <AppBar position="static">
    <Toolbar>
      <MusicNoteIcon sx={{ mr: 2 }} />
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
        Hummify - Audio Converter
      </Typography>
      <Button color="inherit" onClick={onReset}>
        New Conversion
      </Button>
    </Toolbar>
  </AppBar>
);

export default Header;