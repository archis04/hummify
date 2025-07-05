// backend/server.js
require('dotenv').config({ path: './.env' });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
// Removed: const cookieParser = require('cookie-parser');
// Removed: const session = require('express-session');
// Removed: const passport = require('passport');
const connectDB = require('./db');

// Import Routes
const audioRoutes = require("./routes/audioRoutes.js");
const authRoutes = require("./routes/authRoutes.js");

// Removed: Load Passport config - it will be deleted
// require('./config/passport.js');

connectDB();

const app = express();

app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url}`);
  next();
});

// Middleware
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: false })); // Body parser for URL-encoded data
// Removed: app.use(cookieParser()); // Cookie parser no longer strictly needed for auth if not using httpOnly cookies for JWT

// CORS config
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // Keep credentials true if you plan to send any other cookies later
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Expires",
      "Pragma",
    ],
  })
);

// Removed: Session middleware (No longer needed without Passport for OAuth)
/*
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  })
);
*/

// Removed: Passport middleware (No longer needed)
// app.use(passport.initialize());
// app.use(passport.session());

// Routes
app.use("/api/audio", audioRoutes);
app.use("/api/auth", authRoutes);

// 404 fallback
app.use((req, res) => {
  return res.status(404).json({ success: false, message: "Endpoint not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));