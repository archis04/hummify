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

  // New: Normalize note names and ensure volume is integer 0-127
  const sanitizedNotes = notes.map(n => ({
    ...n,
    note: n.note.replace(/♯/g, '#').replace(/♭/g, 'b'),
    volume: Math.round(n.volume)  // Ensure integer volume
  }));

  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    // Run Python script and capture output
    const pythonOutput = await runPython(scriptPath, [instrument], sanitizedNotes);
    
    // Parse Python output
    const result1 = JSON.parse(pythonOutput);
    if (result1.status === "error") {
      throw new Error(`Python script error: ${result1.message}`);
    }

    const result = await cloudinary.uploader.upload(wavPath, {
      resource_type: "video",
      folder: "hummify_audio"
    });

    const audioDoc = await ConvertAudio.create({
      notes: sanitizedNotes,  // Store sanitized notes
      instrument,
      cloudinaryUrl: result.secure_url
    });

    await fs.unlink(midiPath).catch(() => {});
    await fs.unlink(wavPath).catch(() => {});

    res.json({ id: audioDoc._id, url: result.secure_url });
  } catch (err) {
    console.error("convertAudio error:", err);
    res.status(500).json({ 
      error: err.message || "Internal error", 
      details: err.stderr || err.stack 
    });
  }
};

module.exports = { convertAudio };