// frontend/src/components/Header.js
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logoutUser } from '../redux/authSlice';
import { resetAudioState } from '../redux/audioSlice';
import { resetSavedAudioState } from '../redux/savedAudioSlice'; // <-- NEW IMPORT FOR RESETTING SAVED AUDIO STATE

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Link as MuiLink,
  Box // Added Box for spacing
} from '@mui/material';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    console.log('Header: Logout button clicked');
    console.log('Header: Current user state:', user);
    console.log('Header: Current localStorage:', {
      user: localStorage.getItem('user'),
      token: localStorage.getItem('token')
    });

    try {
      console.log('Header: Dispatching logoutUser...');
      await dispatch(logoutUser()).unwrap(); // unwrap to handle rejections for try/catch
      console.log('Header: logoutUser completed successfully');

      dispatch(resetAudioState()); // Reset audio process state on logout
      dispatch(resetSavedAudioState()); // <-- NEW: Reset saved audio state on logout
      console.log('Header: resetAudioState & resetSavedAudioState dispatched');

      navigate('/login'); // Redirect to login page after logout
      console.log('Header: Navigation to /login completed');
    } catch (error) {
      console.error('Header: Logout failed:', error);
      // Even if the backend logout fails, we should still clear local state and redirect
      // This ensures the UI reflects logged out state even if backend has issues
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      dispatch(resetAudioState());
      dispatch(resetSavedAudioState()); // <-- NEW: Reset saved audio state in catch block too
      navigate('/login');
      console.log('Header: Fallback logout completed');
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <MuiLink component={Link} to="/" color="inherit" underline="none">
            Hummify
          </MuiLink>
        </Typography>
        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
              Welcome, {user.name || user.email}
            </Typography>
            {/* NEW LINK TO SAVED AUDIOS */}
            <Button color="inherit" component={Link} to="/my-audios" sx={{ mr: 1 }}>
              My Audios
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button color="inherit" onClick={() => navigate('/login')} sx={{ mr: 1 }}>
              Login
            </Button>
            <Button color="inherit" onClick={() => navigate('/register')}>
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;