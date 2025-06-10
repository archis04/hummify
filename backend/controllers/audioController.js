// backend/controllers/audioController.js
const Audio = require("../models/Audio.js");
const {cloudinary,upload} = require("../helpers/cloudinary.js")
const { spawn } = require("child_process");
const path = require("path");
const InstrumentAudio = require("../models/InstrumentAudio.js");
const synthesize=require("../python/synth.py")
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


const generateInstrumentAudio = async (req, res) => {
  try {
    const { notes, instrument } = req.body;

    if (!Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ success: false, message: "No notes provided." });
    }

    // TODO: Replace this with real synthesis logic (Node-Python or pure Node MIDI)
    const filePath = await synthesizeNotesToAudio(notes, instrument); // .wav or .mp3 temp file

    const result = await cloudinary.uploader.upload(filePath, {
      folder: "instrument_output",
      resource_type: "video",
    });

    // Delete local temp file after upload
    fs.unlinkSync(filePath);

    const newInstrumentAudio = new InstrumentAudio({
      url: result.secure_url,
      public_id: result.public_id,
      original_notes: notes,
      instrument_type: instrument,
    });

    const saved = await newInstrumentAudio.save();

    return res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error("Instrument audio generation error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
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