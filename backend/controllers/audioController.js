// backend/controllers/audioController.js
const Audio = require("../models/Audio.js");
const cloudinary = require("../helpers/cloudinary.js")
const { spawn } = require("child_process");
const path = require("path");

/**
 * Upload audio to Cloudinary and save metadata to MongoDB
 */
const uploadAudio = async (req, res) => {
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

const generateInstrumentAudio = async (req, res) => {
  try {
    const { notes } = req.body; // e.g., ["C4", "D4", "E4"]

    const scriptPath = path.join(__dirname, "../python/synth.py");
    const sf2Path = path.join(__dirname, "../python/GeneralUser.sf2");

    const py = spawn("python", [scriptPath, notes.join(","), sf2Path]);

    let result = "";
    py.stdout.on("data", (data) => {
      result += data.toString();
    });

    py.stderr.on("data", (err) => {
      console.error("Python error:", err.toString());
    });

    py.on("close", async (code) => {
      const outputFile = result.trim(); // like output_123456.wav

      // Upload this outputFile to Cloudinary
      const cloudinaryUpload = await cloudinary.uploader.upload(outputFile, {
        resource_type: "video", folder: "instrument_outputs"
      });

      // Delete local file
      fs.unlinkSync(outputFile);

      res.json({ success: true, url: cloudinaryUpload.secure_url });
    });
  } catch (error) {
    console.error("Instrument generation failed:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// /**

//  * Get all uploaded audios
//  */
// exports.getAllAudios = async (req, res) => {
//   try {
//     const audios = await Audio.find().sort({ createdAt: -1 });
//     return res.status(200).json({ success: true, data: audios });
//   } catch (error) {
//     console.error("Error fetching audios:", error);
//     return res.status(500).json({ success: false, message: "Server Error" });
//   }
// };

// /**
//  * Delete an audio by ID (both from Cloudinary and MongoDB)
//  */
// exports.deleteAudio = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const audio = await Audio.findById(id);
//     if (!audio) {
//       return res.status(404).json({ success: false, message: "Audio not found" });
//     }

//     // Delete from Cloudinary
//     await cloudinary.uploader.destroy(audio.public_id);

//     // Delete from MongoDB
//     await audio.remove();

//     return res.status(200).json({ success: true, message: "Audio deleted" });
//   } catch (error) {
//     console.error("Error deleting audio:", error);
//     return res.status(500).json({ success: false, message: "Server Error" });
//   }
// };
module.exports = {
  uploadAudio,
  generateInstrumentAudio
};