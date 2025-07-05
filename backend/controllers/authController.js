const User = require('../models/User');
const jwt = require('jsonwebtoken'); // Import jwt

// Helper to generate a JWT token and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken(); // Get JWT token from user model method

  const options = {
    expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiration
    httpOnly: true, // Cookie is only accessible by web server
    // secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    // sameSite: 'None', // Adjust for cross-site requests if necessary
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      googleId: user.googleId, // Include googleId
    },
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists with this email
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Server Error', details: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email and password
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Please enter an email and password' });
  }

  try {
    // Check for user (and select password as it's excluded by default)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if it's a Google-only account without a password
    if (user.googleId && !user.password) {
      return res.status(401).json({ success: false, error: 'This account uses Google login. Please log in with Google.' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server Error', details: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private (Requires JWT)
exports.getMe = async (req, res, next) => {
  // req.user is set by the protect middleware
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get Me error:', error);
    res.status(500).json({ success: false, error: 'Server Error', details: error.message });
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = (req, res, next) => {
  // Clear the JWT cookie
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expire quickly
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'production',
    // sameSite: 'None',
  });

  // For Passport.js sessions, also log out from session
  if (req.logout) { // Check if req.logout method exists (provided by passport)
    req.logout((err) => {
      if (err) { 
        console.error('Passport logout error:', err);
        return next(err); 
      }
      console.log('User logged out successfully');
      res.status(200).json({ success: true, message: 'Logged out' });
    });
  } else {
    console.log('User logged out successfully (no Passport session)');
    res.status(200).json({ success: true, message: 'Logged out' });
  }
};