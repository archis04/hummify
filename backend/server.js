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

console.log("Setting up catch-all route...");
app.get('*', (req, res) => {
  console.log("Catch-all route hit for:", req.url);
  res.sendFile(path.resolve(frontendPath, 'index.html'));
});
console.log("Catch-all route set up.");

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
