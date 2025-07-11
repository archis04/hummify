// backend/routes/savedAudioRoutes.js
const express = require('express');
const router = express.Router();
const {
    saveConvertedAudio,
    getAllSavedAudios,
    getSavedAudioById,
    deleteSavedAudio
} = require('../controllers/savedAudioController');
const { protect } = require('../middleware/authMiddleware'); // Import the protect middleware

// All saved audio routes require authentication
router.route('/')
    .post(protect, saveConvertedAudio)    // Save a new converted audio
    .get(protect, getAllSavedAudios);    // Get all saved audios for the user

router.route('/:id')
    .get(protect, getSavedAudioById)     // Get a specific saved audio by ID
    .delete(protect, deleteSavedAudio);  // Delete a saved audio by ID

module.exports = router;