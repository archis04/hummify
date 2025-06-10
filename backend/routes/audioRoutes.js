// backend/routes/audioRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const {cloudinary,upload} = require("../helpers/cloudinary.js");
const {uploadAudio,generateInstrumentAudio} = require("../controllers/audioController.js");
// const { detectPitch } = require("../controllers/detectPitchController.js");
const { analyzeAudio } = require("../controllers/analyzeController.js");

router.post("/upload", upload.single("audio"), uploadAudio);
// router.post("/generate", generateInstrumentAudio);
// router.post("/detect-pitch", detectPitch);
router.post("/analyze", analyzeAudio);

// @route   GET /api/audio/
// @desc    Get all audios
// router.get("/", audioController.getAllAudios);

// @route   DELETE /api/audio/:id
// @desc    Delete audio by ID
// router.delete("/:id", audioController.deleteAudio);

module.exports = router;
