// frontend/src/pages/Register.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, clearAuthError } from '../redux/authSlice'; // Import clearAuthError
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert, // Import Alert for displaying messages
  Link as MuiLink,
} from '@mui/material';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState(null); // For frontend validation errors

  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Get loading, error, and isAuthenticated from authSlice state
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // If successfully authenticated, redirect to home page
    if (isAuthenticated) {
      navigate('/');
    }
    // Clear any previous Redux errors when component mounts or unmounts
    return () => {
      dispatch(clearAuthError());
    };
  }, [isAuthenticated, navigate, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null); // Clear previous local errors

    // Basic frontend validation
    if (!name || !email || !password || !confirmPassword) {
      setLocalError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    // Dispatch registerUser if validation passes
    dispatch(registerUser({ name, email, password }));
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, p: 4, borderRadius: 2, boxShadow: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Register
        </Typography>

        {/* Display local (frontend) errors */}
        {localError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {localError}
          </Alert>
        )}

        {/* Display Redux (backend) errors */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Name"
            variant="outlined"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <TextField
            label="Confirm Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3, py: 1.5 }}
            disabled={loading} // Disable button while loading
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
          </Button>
        </form>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <MuiLink component={Link} to="/login" variant="body2">
              Login here.
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;