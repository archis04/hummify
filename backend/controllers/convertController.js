const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs").promises;
const cloudinary = require("cloudinary").v2;
const runPython = require("../utils/runPython.js");
const ConvertAudio = require("../models/ConvertAudio.js");

const convertAudio = async (req, res) => {
  console.log("Incoming POST request to /convert with body:", req.body);
  const { notes, instrument } = req.body;
  const uploadsDir = path.resolve("uploads");
  const midiPath = path.join(uploadsDir, "output.mid");
  const wavPath = path.join(uploadsDir, "output.wav");
  const scriptPath = path.join(__dirname, "../python/synth.py");

  // Enhanced note sanitization for humming conversion
  const sanitizedNotes = notes.map(n => {
    // Handle both analysis pipeline format and direct note arrays
    const noteObj = n.note ? n : {note: n.note_name, ...n};
    
    return {
      ...noteObj,
      note: noteObj.note.replace(/♯/g, '#').replace(/♭/g, 'b'),
      volume: Math.min(127, Math.max(1, Math.round(noteObj.volume || 100))),
      // Add default values for new properties
      vibrato: noteObj.vibrato || false,
      breathy: noteObj.breathy || false,
      confidence: noteObj.confidence || 1.0
    };
  });

  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Run Python script with instrument argument
    const result = await runPython(scriptPath, [instrument], sanitizedNotes);
    // Parse Python output with enhanced response format
    
    if (result.status === "error") {
      throw new Error(`Python script error: ${result.message}`);
    }
    // const mp3Path = path.join(uploadsDir, "output.mp3");
    // await convertToMP3(wavPath, mp3Path);

    // Upload the processed WAV file
    const cloudinaryResult = await cloudinary.uploader.upload(wavPath, {
      resource_type: "video",
      folder: "hummify_audio",
      // audio_codec: 'aac',
      // bit_rate: 192000
    });

    // Create database document with additional metadata
    const audioDoc = await ConvertAudio.create({
      notes: sanitizedNotes,
      instrument,
      cloudinaryUrl: cloudinaryResult.secure_url,
      tempo: result.tempo || 120,
      duration: cloudinaryResult.duration
    });

    // Cleanup all intermediate files
    await Promise.allSettled([
      fs.unlink(midiPath),
      fs.unlink(wavPath),
      fs.unlink(path.join(uploadsDir, "raw_output.wav")).catch(() => {})
    ]);

  //   await Promise.allSettled([
  //   fs.unlink(midiPath),
  //   fs.unlink(wavPath),
  //   fs.unlink(mp3Path),
  //   fs.unlink(path.join(uploadsDir, "raw_output.wav")).catch(() => {})
  // ]);

    res.json({ 
      id: audioDoc._id, 
      url: cloudinaryResult.secure_url,
      tempo: audioDoc.tempo,
      duration: audioDoc.duration
    });
    
  } catch (err) {
    console.error("convertAudio error:", err);
    
    // Enhanced error information
    res.status(500).json({ 
      error: err.message || "Audio conversion failed",
      details: err.response?.data || err.stack 
    });
  }
};

module.exports = { convertAudio };