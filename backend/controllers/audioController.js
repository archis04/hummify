// backend/controllers/audioController.js
const Audio = require("../models/Audio.js");
const {cloudinary,upload} = require("../helpers/cloudinary.js")
const { spawn } = require("child_process");
const path = require("path");
const fs = require('fs');
const streamifier = require("streamifier");

const uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "audio_uploads",
            resource_type: "video",
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req);
    // fs.writeFileSync(path.join(__dirname, "../python/latest_url.txt"), result.secure_url);

    const newAudio = new Audio({
      url: result.secure_url,
      public_id: result.public_id,
      original_filename: result.original_filename,
    });

    const savedAudio = await newAudio.save();

    return res.status(201).json({ success: true, data: savedAudio });
  } catch (error) {
    console.error("Upload failed:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



module.exports = {
  uploadAudio,
  
};