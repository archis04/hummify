console.log("=== SERVER.JS ENTRYPOINT REACHED ===");
require('dotenv').config({ path: './.env' });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require('./db');
const path = require('path');

// Import Routes
console.log("Importing audioRoutes...");
const audioRoutes = require("./routes/audioRoutes.js");
console.log("audioRoutes imported.");

console.log("Importing authRoutes...");
const authRoutes = require("./routes/authRoutes.js");
console.log("authRoutes imported.");

console.log("Importing savedAudioRoutes...");
const savedAudioRoutes = require("./routes/savedAudioRoutes.js");
console.log("savedAudioRoutes imported.");

// Import Cleanup Scheduler
const cleanupScheduler = require('./utils/cleanupScheduler');

connectDB();

const app = express();

// Top-level request logger
app.use((req, res, next) => {
  console.log(`[TOP-LEVEL] ${req.method} ${req.url}`);
  next();
});

// Increase body parser limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// ✅ CORS (now relaxed or can remove completely)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "DELETE", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ API Routes
console.log("Setting up /api/audio route...");
app.use("/api/audio", audioRoutes);
console.log("/api/audio route set up.");

console.log("Setting up /api/auth route...");
app.use("/api/auth", authRoutes);
console.log("/api/auth route set up.");

console.log("Setting up /api/saved-audios route...");
app.use("/api/saved-audios", savedAudioRoutes);
console.log("/api/saved-audios route set up.");

console.log("Setting up frontend static files...");
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
console.log("Frontend path:", frontendPath);

console.log("Setting up express.static...");
app.use(express.static(frontendPath));
console.log("express.static set up.");

// Health check route for Render
app.get('/healthz', (req, res) => {
  res.send('OK');
});

console.log("Setting up catch-all route...");
app.get(/^\/(?!api).*/, (req, res) => {
  console.log("Serving frontend index.html for:", req.url);
  res.sendFile(path.resolve(frontendPath, 'index.html'));
});
console.log("Catch-all route set up.");

// Add global error handler at the end
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR HANDLER]', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
