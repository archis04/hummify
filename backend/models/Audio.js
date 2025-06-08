// models/Audio.js

const mongoose = require("mongoose");

const audioSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true, // Cloudinary URL
    },
    public_id: {
      type: String,
      required: true, // Cloudinary public ID (e.g., audio_uploads/audio_1749405072766)
    },
    original_filename: {
      type: String,
      required: true, // e.g., recording_1749405072714.webm
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

module.exports = mongoose.model("Audio", audioSchema);
