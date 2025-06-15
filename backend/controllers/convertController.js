// controllers/convertController.js
const path        = require("path");
const fs          = require("fs").promises;
const cloudinary  = require("cloudinary").v2;
const runPython   = require("../utils/runPython.js");
const ConvertAudio = require("../models/ConvertAudio.js");

const convertAudio = async (req, res) => {
  const { notes, instrument } = req.body;
  const uploadsDir = path.resolve("uploads");
  const midiPath   = path.join(uploadsDir, "output.mid");
  const wavPath    = path.join(uploadsDir, "output.wav");
  const scriptPath = path.join(__dirname, "../python/synth.py");
  console.log("scriptpath",scriptPath);
  

  const sanitizedNotes = notes.map(n => ({
  ...n,
  note: n.note.replace(/♯/g, '#'),
}));
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log("Sending notes:", JSON.stringify(sanitizedNotes, null, 2));
    console.log("Before running Python");
    console.log("scriptpath",scriptPath);
    await runPython(scriptPath, [instrument], sanitizedNotes);
    console.log("After running Python"); 

    const result = await cloudinary.uploader.upload(wavPath, {
      resource_type: "video",
      folder: "hummify_audio"
    });

    const audioDoc = await ConvertAudio.create({
      notes,
      instrument,
      cloudinaryUrl: result.secure_url
    });
    console.log("audioDoc",audioDoc);
    

    await fs.unlink(midiPath);
    await fs.unlink(wavPath);

    res.json({ id: audioDoc._id, url: result.secure_url });
  } catch (err) {
    console.error("convertAudio error:", err);
    res.status(500).json({ error: err.message || "Internal error", details: err.stderr });
  }
};

module.exports={convertAudio}
