const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate a JWT token and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    httpOnly: true,
    secure: true,              // 🔥 Required on Render
    sameSite: 'None'           // 🔥 Required for cross-origin cookies
  };

  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        googleId: user.googleId,
      },
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    user = await User.create({ name, email, password });
    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Server Error', details: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Please enter an email and password' });
  }

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.googleId && !user.password) {
      return res.status(401).json({ success: false, error: 'This account uses Google login. Please log in with Google.' });
    }

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
// @access  Private
exports.getMe = async (req, res) => {
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
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: true,              // 🔥 match login cookie settings
    sameSite: 'None'
  });

  if (req.logout) {
    req.logout((err) => {
      if (err) return next(err);
      console.log('User logged out successfully');
      res.status(200).json({ success: true, message: 'Logged out' });
    });
  } else {
    console.log('User logged out (no passport session)');
    res.status(200).json({ success: true, message: 'Logged out' });
  }
};
