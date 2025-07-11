// backend/controllers/convertController.js
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

    const sanitizedNotes = notes.map(n => {
        const noteObj = n.note ? n : { note: n.note_name, ...n };
        return {
            ...noteObj,
            note: noteObj.note.replace(/♯/g, '#').replace(/♭/g, 'b'),
            volume: Math.min(127, Math.max(1, Math.round(noteObj.volume || 100))),
            vibrato: noteObj.vibrato || false,
            breathy: noteObj.breathy || false,
            confidence: noteObj.confidence || 1.0
        };
    });

    try {
        await fs.mkdir(uploadsDir, { recursive: true });

        const result = await runPython(scriptPath, [instrument], sanitizedNotes);

        if (result.status === "error") {
            throw new Error(`Python script error: ${result.message}`);
        }

        const cloudinaryResult = await cloudinary.uploader.upload(wavPath, {
            resource_type: "video", // Important for audio files on Cloudinary
            folder: "hummify_audio",
        });

        const audioDoc = await ConvertAudio.create({
            notes: sanitizedNotes,
            instrument,
            cloudinaryUrl: cloudinaryResult.secure_url,
            cloudinaryPublicId: cloudinaryResult.public_id, // ADDED THIS LINE: Save public_id
            tempo: result.tempo || 120,
            duration: cloudinaryResult.duration
        });

        await Promise.allSettled([
            fs.unlink(midiPath),
            fs.unlink(wavPath),
            fs.unlink(path.join(uploadsDir, "raw_output.wav")).catch(() => { }) // Catch to prevent error if file doesn't exist
        ]);

        res.json({
            success: true,
            data: {
                id: audioDoc._id,
                url: cloudinaryResult.secure_url,
                cloudinaryPublicId: cloudinaryResult.public_id, // ADDED THIS LINE: Return public_id to frontend
                tempo: audioDoc.tempo,
                duration: audioDoc.duration
            }
        });

    } catch (err) {
        console.error("convertAudio error:", err);
        res.status(500).json({
            success: false,
            error: err.message || "Audio conversion failed",
            details: err.response?.data || err.stack
        });
    }
};

module.exports = { convertAudio };