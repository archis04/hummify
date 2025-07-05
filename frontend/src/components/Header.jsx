// frontend/src/components/Header.js
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logoutUser } from '../redux/authSlice';
import { resetProcess } from '../redux/audioSlice';

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Link as MuiLink,
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
      await dispatch(logoutUser()).unwrap();
      console.log('Header: logoutUser completed successfully');

      dispatch(resetProcess()); // Reset audio process state on logout
      console.log('Header: resetProcess dispatched');

      navigate('/login'); // Redirect to login page after logout
      console.log('Header: Navigation to /login completed');
    } catch (error) {
      console.error('Header: Logout failed:', error);
      // Even if the backend logout fails, we should still clear local state and redirect
      // This ensures the UI reflects logged out state even if backend has issues
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      dispatch(resetProcess());
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
          <>
            <Typography variant="subtitle1" sx={{ mr: 2 }}>
              Welcome, {user.name || user.email}
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button color="inherit" onClick={() => navigate('/register')}>
              Register
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;