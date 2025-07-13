require('dotenv').config({ path: './.env' });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require('./db');
const path = require('path');

// Import Routes
const audioRoutes = require("./routes/audioRoutes.js");
const authRoutes = require("./routes/authRoutes.js");
const savedAudioRoutes = require("./routes/savedAudioRoutes.js");

// Import Cleanup Scheduler
const cleanupScheduler = require('./utils/cleanupScheduler');

connectDB();

const app = express();

// ✅ Middleware for logging
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url}`);
  next();
});

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ✅ CORS (now relaxed or can remove completely)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "DELETE", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ API Routes
app.use("/api/audio", audioRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/saved-audios", savedAudioRoutes);

// ✅ Serve static frontend
app.use(express.static(path.join(__dirname, 'client')));

// ✅ Fallback for React routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'index.html'));
});

// ❌ This should NOT come after React fallback
// You can REMOVE this if you're already handling 404s in React
// If you keep it, move it *above* app.get('*')
