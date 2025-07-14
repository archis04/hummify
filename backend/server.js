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

// Connect to DB
connectDB();

const app = express();

// ===== 🟡 TOP-LEVEL REQUEST LOGGER =====
app.use((req, res, next) => {
  console.log(`[TOP-LEVEL] ${req.method} ${req.url}`);
  next();
});

// ===== ✅ FILTERED API REQUEST LOGGER (EXCLUDING /healthz) =====
app.use((req, res, next) => {
  const isApi = req.url.startsWith('/api') && req.url !== '/healthz';
  if (isApi) {
    console.log(`[API REQUEST] ${req.method} ${req.url}`);
  }
  next();
});

// ===== 🔧 PARSERS & MIDDLEWARE =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "DELETE", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ===== 🔌 ROUTES =====
app.use("/api/audio", audioRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/saved-audios", savedAudioRoutes);

// ===== 🌐 FRONTEND STATIC FILES =====
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendPath));

// ===== 🩺 HEALTH CHECK ROUTE =====
app.get('/healthz', (req, res) => {
  res.send('OK');
});

// ===== 🌍 CATCH-ALL TO SERVE FRONTEND =====
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.resolve(frontendPath, 'index.html'));
});

// ===== ❌ GLOBAL ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR HANDLER]', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });
  res.status(500).json({
    error: 'Internal server error',
    details: err.message,
  });
});

// ===== 🚀 START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT);
