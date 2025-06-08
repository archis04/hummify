// backend/controllers/audioController.js
const Audio = require("../models/Audio.js");
const cloudinary = require("../helpers/cloudinary.js")

/**
 * Upload audio to Cloudinary and save metadata to MongoDB
 */
exports.uploadAudio = async (req, res) => {
  try {
    console.log("📦 req.file =", req.file);

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const newAudio = new Audio({
      url: req.file.path, // ✅ Use 'path' as Cloudinary URL
      public_id: req.file.filename, // ✅ Use 'filename' as Cloudinary ID
      original_filename: req.file.originalname, // ✅ Original filename
    });

    const savedAudio = await newAudio.save();

    return res.status(201).json({ success: true, data: savedAudio });
  } catch (error) {
    console.error("Error uploading audio:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * Get all uploaded audios
 */
exports.getAllAudios = async (req, res) => {
  try {
    const audios = await Audio.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: audios });
  } catch (error) {
    console.error("Error fetching audios:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * Delete an audio by ID (both from Cloudinary and MongoDB)
 */
exports.deleteAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const audio = await Audio.findById(id);
    if (!audio) {
      return res.status(404).json({ success: false, message: "Audio not found" });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(audio.public_id);

    // Delete from MongoDB
    await audio.remove();

    return res.status(200).json({ success: true, message: "Audio deleted" });
  } catch (error) {
    console.error("Error deleting audio:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
