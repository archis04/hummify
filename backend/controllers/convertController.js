// // backend/controllers/convertController.js
// const path = require("path");
// const fs = require("fs").promises;
// const cloudinary = require("cloudinary").v2;
// const runPython = require("../utils/runPython.js");
// const ConvertAudio = require("../models/ConvertAudio.js");

// const convertAudio = async (req, res) => {
//     console.log("[convertAudio] Incoming POST request to /convert with body:", req.body);
//     const { notes, instrument } = req.body;
//     const uploadsDir = path.resolve("uploads");
//     const midiPath = path.join(uploadsDir, "output.mid");
//     const wavPath = path.join(uploadsDir, "output.wav");
//     const scriptPath = path.join(__dirname, "../python/synth.py");

//     console.log("[convertAudio] uploadsDir:", uploadsDir);
//     console.log("[convertAudio] midiPath:", midiPath);
//     console.log("[convertAudio] wavPath:", wavPath);
//     console.log("[convertAudio] scriptPath:", scriptPath);

//     const sanitizedNotes = notes.map(n => {
//         const noteObj = n.note ? n : { note: n.note_name, ...n };
//         return {
//             ...noteObj,
//             note: noteObj.note.replace(/♯/g, '#').replace(/♭/g, 'b'),
//             volume: Math.min(127, Math.max(1, Math.round(noteObj.volume || 100))),
//             vibrato: noteObj.vibrato || false,
//             breathy: noteObj.breathy || false,
//             confidence: noteObj.confidence || 1.0
//         };
//     });
//     console.log("[convertAudio] sanitizedNotes:", sanitizedNotes);

//     try {
//         await fs.mkdir(uploadsDir, { recursive: true });
//         console.log("[convertAudio] uploadsDir ensured.");

//         const result = await runPython(scriptPath, [instrument], sanitizedNotes);
//         console.log("[convertAudio] Python script result:", result);

//         if (result.status === "error") {
//             throw new Error(`Python script error: ${result.message}`);
//         }

//         const cloudinaryResult = await cloudinary.uploader.upload(wavPath, {
//             resource_type: "video", // Important for audio files on Cloudinary
//             folder: "hummify_audio",
//         });
//         console.log("[convertAudio] cloudinaryResult:", cloudinaryResult);

//         const audioDoc = await ConvertAudio.create({
//             notes: sanitizedNotes,
//             instrument,
//             cloudinaryUrl: cloudinaryResult.secure_url,
//             cloudinaryPublicId: cloudinaryResult.public_id, // ADDED THIS LINE: Save public_id
//             tempo: result.tempo || 120,
//             duration: cloudinaryResult.duration
//         });
//         console.log("[convertAudio] audioDoc created:", audioDoc);

//         await Promise.allSettled([
//             fs.unlink(midiPath),
//             fs.unlink(wavPath),
//             fs.unlink(path.join(uploadsDir, "raw_output.wav")).catch(() => { }) // Catch to prevent error if file doesn't exist
//         ]);
//         console.log("[convertAudio] Temporary files cleaned up.");

//         res.json({
//             success: true,
//             data: {
//                 id: audioDoc._id,
//                 url: cloudinaryResult.secure_url,
//                 cloudinaryPublicId: cloudinaryResult.public_id, // ADDED THIS LINE: Return public_id to frontend
//                 tempo: audioDoc.tempo,
//                 duration: audioDoc.duration
//             }
//         });

//     } catch (err) {
//         console.error("[convertAudio] error:", err);
//         res.status(500).json({
//             success: false,
//             error: err.message || "Audio conversion failed",
//             details: err.response?.data || err.stack
//         });
//     }
// };

// module.exports = { convertAudio };

const fetch = require("node-fetch");

exports.analyzeAudio = async (req, res) => {
  const { audioUrl } = req.body;
  console.log("[analyzeAudio] Incoming request body:", req.body);

  if (!audioUrl) {
    console.log("[analyzeAudio] audioUrl missing in request body");
    return res.status(400).json({ error: "audioUrl is required" });
  }

  try {
    const response = await fetch("https://arcriser-audiotonotes.hf.space/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioUrl }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[analyzeAudio] Hugging Face Error:", result);
      return res.status(response.status).json(result);
    }

    console.log("[analyzeAudio] Received result from Hugging Face:", result);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("[analyzeAudio] Error while calling Hugging Face:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
