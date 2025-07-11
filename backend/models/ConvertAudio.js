// backend/models/ConvertAudio.js
const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
    note: { type: String, required: true },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    duration: { type: Number, required: true },
    volume: { type: Number, required: true },
    vibrato: { type: Boolean, default: false },
    breathy: { type: Boolean, default: false },
    confidence: { type: Number, default: 1.0 }
}, { _id: false });

const convertAudioSchema = new mongoose.Schema({
    notes: { type: [noteSchema], required: true },
    instrument: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true }, // ADDED THIS LINE
    tempo: { type: Number, default: 120 },
    duration: { type: Number, required: true },
}, {
    timestamps: true // Ensures createdAt is present for aging out
});

module.exports = mongoose.model("ConvertAudio", convertAudioSchema);