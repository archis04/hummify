// backend/controllers/audioController.js
const Audio = require("../models/Audio.js");
const cloudinary = require("../helpers/cloudinary.js")

/**
 * Upload audio to Cloudinary and save metadata to MongoDB
 */
exports.uploadAudio = async (req, res) => {
  try {
    // multer has already stored file info in req.file
    // req.file.path is the local temp path; since we're using multer-storage-cloudinary, req.file already has cloudinary info

    const { secure_url, public_id, original_filename } = req.file;

    // Create a new Audio document
    const newAudio = new Audio({
      url: secure_url,
      public_id,
      original_filename,
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
