// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
// Removed: const passport = require('passport'); // No longer needed
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Local Auth
router.post('/register', register);
router.post('/login', login);
router.get('/logout', protect, logout);

// Removed: Google OAuth routes are entirely removed
/*
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
  (req, res) => {
    console.log('[BACKEND AUTH] Initiating Google OAuth redirect...');
  }
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: true
  }),
  (req, res) => {
    console.log('\n--- BACKEND AUTH: Google Callback Route Hit ---');

    if (!req.user) {
      console.error('[BACKEND AUTH] ERROR: req.user is undefined after Passport authentication.');
      console.error('[BACKEND AUTH] Redirecting to failure page:', `${process.env.CLIENT_URL}/login`);
      return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
    }

    console.log('[BACKEND AUTH] Successfully authenticated via Google Passport strategy.');
    console.log('[BACKEND AUTH] req.user details:', {
      _id: req.user._id,
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      googleId: req.user.googleId,
    });

    let token;
    try {
      token = req.user.getSignedJwtToken();
      console.log('[BACKEND AUTH] JWT Token generated successfully.');
    } catch (error) {
      console.error('[BACKEND AUTH] ERROR: Failed to generate JWT token:', error.message);
      console.error(error.stack);
      return res.status(500).json({ success: false, error: 'Failed to generate authentication token.' });
    }

    if (!process.env.CLIENT_URL) {
      console.error('[BACKEND AUTH] ERROR: CLIENT_URL environment variable is not defined!');
      return res.status(500).json({ success: false, error: 'Server configuration error: CLIENT_URL missing.' });
    }

    const frontendRedirectUrl = `${process.env.CLIENT_URL}/auth/google/callback` +
      `?token=${token}` +
      `&name=${encodeURIComponent(req.user.name)}` +
      `&email=${encodeURIComponent(req.user.email)}` +
      `&id=${req.user._id}`;

    console.log('[BACKEND AUTH] Final redirect URL to frontend:', frontendRedirectUrl);
    console.log('[BACKEND AUTH] CLIENT_URL being used for redirect:', process.env.CLIENT_URL);

    res.redirect(frontendRedirectUrl);
  }
);
*/

// Protected route to get user info
router.get('/me', protect, getMe);

module.exports = router;