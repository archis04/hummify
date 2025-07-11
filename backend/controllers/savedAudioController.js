// backend/controllers/savedAudioController.js
const SavedAudio = require("../models/SavedAudio");
const cloudinary = require("cloudinary").v2; // For Cloudinary deletion

// @desc    Save a converted audio
// @route   POST /api/saved-audios
// @access  Private
exports.saveConvertedAudio = async (req, res) => {
    try {
        const { name, convertedAudioUrl, instrument, notes, tempo, duration, cloudinaryPublicId } = req.body;

        if (!name || !convertedAudioUrl || !instrument || !notes || !tempo || !duration || !cloudinaryPublicId) {
            return res.status(400).json({ success: false, message: "Missing required fields for saving audio." });
        }

        // The user ID comes from the protect middleware (req.user.id)
        const newSavedAudio = new SavedAudio({
            user: req.user.id, // User ID from authenticated request
            name,
            convertedAudioUrl,
            instrument,
            notes,
            tempo,
            duration,
            cloudinaryPublicId, // Now required and passed from frontend
        });

        const savedAudio = await newSavedAudio.save();

        res.status(201).json({
            success: true,
            message: "Audio saved successfully!",
            data: savedAudio,
        });

    } catch (error) {
        console.error("Error saving audio:", error);
        res.status(500).json({ success: false, message: "Server error while saving audio." });
    }
};

// @desc    Get all saved audios for the authenticated user
// @route   GET /api/saved-audios
// @access  Private
exports.getAllSavedAudios = async (req, res) => {
    try {
        const savedAudios = await SavedAudio.find({ user: req.user.id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: savedAudios.length,
            data: savedAudios,
        });

    } catch (error) {
        console.error("Error fetching saved audios:", error);
        res.status(500).json({ success: false, message: "Server error while fetching audios." });
    }
};

// @desc    Get a single saved audio by ID for the authenticated user
// @route   GET /api/saved-audios/:id
// @access  Private
exports.getSavedAudioById = async (req, res) => {
    try {
        const savedAudio = await SavedAudio.findOne({ _id: req.params.id, user: req.user.id });

        if (!savedAudio) {
            return res.status(404).json({ success: false, message: "Saved audio not found or unauthorized." });
        }

        res.status(200).json({
            success: true,
            data: savedAudio,
        });

    } catch (error) {
        console.error("Error fetching single saved audio:", error);
        res.status(500).json({ success: false, message: "Server error while fetching audio." });
    }
};


// @desc    Delete a saved audio
// @route   DELETE /api/saved-audios/:id
// @access  Private
exports.deleteSavedAudio = async (req, res) => {
    try {
        const savedAudio = await SavedAudio.findOne({ _id: req.params.id, user: req.user.id });

        if (!savedAudio) {
            return res.status(404).json({ success: false, message: "Saved audio not found or unauthorized." });
        }

        // Delete the audio from Cloudinary
        if (savedAudio.cloudinaryPublicId) {
            try {
                // Cloudinary resource_type for audio/video is 'video'
                await cloudinary.uploader.destroy(savedAudio.cloudinaryPublicId, { resource_type: 'video' });
                console.log(`Cloudinary asset ${savedAudio.cloudinaryPublicId} deleted.`);
            } catch (cloudinaryErr) {
                console.error("Failed to delete Cloudinary asset:", cloudinaryErr);
                // Continue with DB deletion even if Cloudinary deletion fails
            }
        }

        await savedAudio.deleteOne(); // Mongoose 6+ uses deleteOne() or deleteMany()

        res.status(200).json({ success: true, message: "Audio deleted successfully!" });

    } catch (error) {
        console.error("Error deleting audio:", error);
        res.status(500).json({ success: false, message: "Server error while deleting audio." });
    }
};