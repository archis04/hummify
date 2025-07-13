// backend/server.js
require('dotenv').config({ path: './.env' });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // ✅ Needed to read cookies
const connectDB = require('./db');

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
app.use(cookieParser()); // ✅ Parse cookies

// ✅ CORS config for frontend <-> backend cookie/token exchange
app.use(
  cors({
    origin: 'https://hummify.onrender.com',
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Routes
app.use("/api/audio", audioRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/saved-audios", savedAudioRoutes);

// ✅ 404 fallback
app.use((req, res) => {
  return res.status(404).json({ success: false, message: "Endpoint not found" });
});

// ✅ Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  cleanupScheduler();
});
