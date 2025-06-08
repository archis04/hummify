// backend/routes/audioRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../helpers/cloudinary.js");
const {uploadAudio,generateInstrumentAudio} = require("../controllers/audioController.js");

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Ensure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, "audio_" + uniqueSuffix);
  },
});
const upload = multer({ storage });

// @route   POST /api/audio/upload
// @desc    Upload a new audio
router.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    // Manually upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "audio_uploads",
      resource_type: "auto",
    });

    // Cleanup local file after upload
    fs.unlinkSync(req.file.path);

    // Forward result to controller
    req.uploadedFile = {
      url: result.secure_url,
      public_id: result.public_id,
      original_filename: result.original_filename,
    };

  uploadAudio(req, res);
  } catch (error) {
    console.error("Error uploading audio to Cloudinary:", error);
    res.status(500).json({ success: false, message: "Cloudinary upload failed" });
  }
});

// router.post('/generate', generateInstrumentAudio,async(req,res)=>{
//   try {
//     console.log("Request body:", req.body);
//   } catch (error) {
//     console.log("error is",error);
    
//   }
// });

router.post("/generate", generateInstrumentAudio ,async (req, res) => {
  console.log("Received request to /api/audio/generate");
  try {
    // Log request body or params
    console.log("Request body:", req.body);

    // Call your processing function (e.g., Node <-> Python bridge)
    console.log("Calling audio processing...");

    // Simulate processing delay or actual call
    const result = await yourAudioProcessingFunction(req.body);

    console.log("Processing done, sending response");

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error in /api/audio/generate:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


// @route   GET /api/audio/
// @desc    Get all audios
// router.get("/", audioController.getAllAudios);

// @route   DELETE /api/audio/:id
// @desc    Delete audio by ID
// router.delete("/:id", audioController.deleteAudio);

module.exports = router;
