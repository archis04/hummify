// backend/routes/audioRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../helpers/cloudinary.js")
const audioController = require("../controllers/audioController.js");

// Configure multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "audio_uploads", // folder name in your Cloudinary account
    resource_type: "auto",
    format: async (req, file) => {
      // keep original format (mp3, wav, etc.)
      return file.mimetype.split("/")[1];
    },
    public_id: (req, file) => {
      // you could customize public_id, e.g. timestamp
      return `audio_${Date.now()}`;
    },
  },
});

const parser = multer({ storage });

// @route   POST /api/audio/upload
// @desc    Upload a new audio
router.post("/upload", parser.single("audio"), audioController.uploadAudio);

// @route   GET /api/audio/
// @desc    Get all audios
router.get("/", audioController.getAllAudios);

// @route   DELETE /api/audio/:id
// @desc    Delete audio by ID
router.delete("/:id", audioController.deleteAudio);

module.exports = router;
