// backend/models/SavedAudio.js
const mongoose = require("mongoose");

// Re-use the noteSchema from ConvertAudio.js for consistency
const noteSchema = new mongoose.Schema({
    note: { type: String, required: true },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    duration: { type: Number, required: true },
    volume: { type: Number, required: true },
    vibrato: { type: Boolean, default: false },
    breathy: { type: Boolean, default: false },
    confidence: { type: Number, default: 1.0 }
}, { _id: false }); // Do not create a separate _id for subdocuments

const savedAudioSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide a name for your saved audio'],
        trim: true,
        maxlength: [100, 'Audio name cannot be more than 100 characters'],
    },
    convertedAudioUrl: {
        type: String,
        required: true,
    },
    cloudinaryPublicId: { // This will be used for deletion from Cloudinary
        type: String,
        required: true, // Now required as convertController will provide it
    },
    instrument: {
        type: String,
        required: true,
    },
    notes: { // Storing the analysis notes directly with the saved audio
        type: [noteSchema],
        required: true,
    },
    tempo: {
        type: Number,
        default: 120,
    },
    duration: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

module.exports = mongoose.model("SavedAudio", savedAudioSchema);