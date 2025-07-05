// const passport = require('passport');
// const LocalStrategy = require('passport-local').Strategy;
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const User = require('../models/User'); // Adjust path as necessary
// const jwt = require('jsonwebtoken'); // Although Passport handles it, good to have if we generate directly

// console.log('--- PASSPORT.JS CONFIGURATION START ---');
//   console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Loaded' : 'NOT LOADED');
//   console.log('GOOGLE_CALLBACK_URL from .env (in passport.js):', process.env.GOOGLE_CALLBACK_URL); // CRUCIAL LOG
// // For session management (required for Google OAuth redirect flow)
// // Passport will serialize the user ID to the session, and deserialize it on subsequent requests
// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await User.findById(id);
//     done(null, user);
//   } catch (error) {
//     done(error, null);
//   }
// });

// // Local Strategy (for email and password login)
// passport.use(
//   new LocalStrategy(
//     {
//       usernameField: 'email', // Use 'email' as the username field
//       passwordField: 'password',
//     },
//     async (email, password, done) => {
//       try {
//         const user = await User.findOne({ email }).select('+password'); // Select password field
//         if (!user) {
//           return done(null, false, { message: 'Invalid credentials' });
//         }
//         if (user.googleId && !user.password) {
//           // If it's a Google-only account, cannot log in with password
//           return done(null, false, { message: 'This account uses Google login. Please log in with Google.' });
//         }
//         const isMatch = await user.matchPassword(password);
//         if (!isMatch) {
//           return done(null, false, { message: 'Invalid credentials' });
//         }
//         return done(null, user);
//       } catch (error) {
//         return done(error);
//       }
//     }
//   )
// );

// // Google Strategy
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: process.env.GOOGLE_CALLBACK_URL,
//       scope: ['profile', 'email'], // Request profile and email access
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         let user = await User.findOne({ googleId: profile.id });

//         if (user) {
//           // User already exists, log them in
//           done(null, user);
//         } else {
//           // Check if a user with the same email already exists (e.g., they registered locally first)
//           user = await User.findOne({ email: profile.emails[0].value });
//           if (user) {
//             // Link Google account to existing local account
//             user.googleId = profile.id;
//             await user.save();
//             done(null, user);
//           } else {
//             // Create a new user
//             const newUser = new User({
//               name: profile.displayName,
//               email: profile.emails[0].value,
//               googleId: profile.id,
//               // No password for Google-only users
//             });
//             await newUser.save();
//             done(null, newUser);
//           }
//         }
//       } catch (error) {
//         done(error, null);
//       }
//     }
//   )
// );

// module.exports = passport;