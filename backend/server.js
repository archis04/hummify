console.log("=== SERVER.JS ENTRYPOINT REACHED ===");
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

const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');

app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(frontendPath, 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
