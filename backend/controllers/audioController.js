// backend/controllers/audioController.js
const Audio = require("../models/Audio.js");
const {cloudinary,upload} = require("../helpers/cloudinary.js")
const { spawn } = require("child_process");
const path = require("path");
const fs = require('fs');
const streamifier = require("streamifier");




const uploadAudio = async (req, res) => {
  try {
     console.log("📦 Received file in controller:", req.file?.originalname || "No file found by Multer");
  console.log("📦 File buffer size:", req.file?.buffer?.length || "N/A"); // Check if buffer exists and has size

    if (!req.file) {
      console.log("🚫 No file was uploaded by the client or processed by Multer.");
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
     console.log("🚀 Starting Cloudinary stream upload...");
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "audio_uploads",
            resource_type: "video",
          },
          (error, result) => {
            if (result) {
              console.log("✅ Cloudinary upload successful. URL:", result.secure_url);
              resolve(result);
            } else {
              console.error("❌ Cloudinary upload failed:", error);
              reject(error);
              reject(error);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req);
    // fs.writeFileSync(path.join(__dirname, "../python/latest_url.txt"), result.secure_url);
    console.log("💾 Saving audio details to MongoDB...");
    const newAudio = new Audio({
      url: result.secure_url,
      public_id: result.public_id,
      original_filename: result.original_filename,
    });

    const savedAudio = await newAudio.save();
    console.log("🎉 Audio details saved to DB:", savedAudio._id);
    return res.status(201).json({ success: true, data: savedAudio });
  } catch (error) {
    
   console.error("❌ Upload failed with error:", error?.message || error);

    return res.status(500).json({ success: false, message: "Server error" });
  }
};



module.exports = {
  uploadAudio,
  
};