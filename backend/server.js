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

// Top-level request logger
app.use((req, res, next) => {
  next();
});

// Increase body parser limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "DELETE", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// API Routes
app.use("/api/audio", audioRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/saved-audios", savedAudioRoutes);

// Serve frontend static files
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendPath));

// Health check route
app.get('/healthz', (req, res) => {
  res.send('OK');
});

// Catch-all route for frontend
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.resolve(frontendPath, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT);
