// frontend/src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
// Changed: Imported clearAuthError instead of resetAuth
import { loginUser, clearAuthError } from '../redux/authSlice';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
// REMOVED: Google button icon and related import

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { email, password } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Renamed message to error for consistency with authSlice state variable 'error'
  const { user, loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    console.log('[Login] useEffect triggered');
    console.log('[Login] Redux state:', { user, error, isAuthenticated }); // Updated to 'error'
    console.log('[Login] localStorage:', {
      user: localStorage.getItem('user'),
      token: localStorage.getItem('token'),
    });

    if (error) { // Use 'error' here
      console.error('[Login] Error:', error);
    }

    // Redirect to home/dashboard on successful login or if already logged in
    if (isAuthenticated || user) { // Check isAuthenticated first, then user
      console.log('[Login] Redirecting to /');
      navigate('/');
    }

    // REMOVED: Google OAuth Callback useEffect logic
    // (This block was already commented out, keeping it removed)

  }, [user, error, isAuthenticated, navigate, dispatch]); // Updated dependencies

  // Clear auth error state on unmount
  useEffect(() => {
    return () => {
      // Changed: Dispatch clearAuthError instead of resetAuth
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const userData = {
      email,
      password,
    };
    dispatch(loginUser(userData)); // Dispatch the async thunk for local login
  };

  // REMOVED: handleGoogleLogin function

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 3,
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Sign In
        </Typography>
        {/* Use 'error' for display */}
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={onSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={onChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={onChange}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading} // Use 'loading' (formerly isLoading)
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>

          {/* REMOVED: Google Sign-in Button */}

          <Box sx={{ textAlign: 'center' }}>
            <Link to="/register" style={{ textDecoration: 'none', color: 'inherit' }}>
              Don't have an account? Sign Up
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;