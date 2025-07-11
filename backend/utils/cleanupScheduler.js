// backend/utils/cleanupScheduler.js
const cron = require('node-cron');
const cloudinary = require('cloudinary').v2;
const Audio = require('../models/Audio'); // For original uploaded audios
const ConvertAudio = require('../models/ConvertAudio'); // For temporary converted audios
const SavedAudio = require('../models/SavedAudio'); // To check if converted audio was saved

const cleanUpOldAudios = () => {
    // Schedule to run every 12 hours at minute 0 (e.g., 12:00 AM, 12:00 PM)
    // For testing, you might use '*/5 * * * *' (every 5 minutes)
    cron.schedule('0 */12 * * *', async () => {
        console.log('Running scheduled audio cleanup...');
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours in milliseconds

        try {
            // --- Cleanup original uploaded audios (from Audio model) ---
            const oldUploadedAudios = await Audio.find({ createdAt: { $lt: twelveHoursAgo } });
            console.log(`Found ${oldUploadedAudios.length} old uploaded audios to consider for deletion.`);

            for (const audio of oldUploadedAudios) {
                try {
                    // Check if the original uploaded audio is referenced by any saved audio (optional, but safer)
                    // If you want to keep original hums if their converted versions are saved, you'd need a link.
                    // For now, assuming original hums are *always* temporary after 12 hours.
                    await cloudinary.uploader.destroy(audio.public_id, { resource_type: 'video' });
                    await Audio.deleteOne({ _id: audio._id });
                    console.log(`Deleted original audio: ${audio.public_id} from Cloudinary and DB.`);
                } catch (err) {
                    console.error(`Failed to delete original audio ${audio.public_id}:`, err.message);
                }
            }

            // --- Cleanup unsaved converted audios (from ConvertAudio model) ---
            const oldConvertedAudios = await ConvertAudio.find({ createdAt: { $lt: twelveHoursAgo } });
            console.log(`Found ${oldConvertedAudios.length} old converted audios to consider for deletion.`);

            for (const convertedAudio of oldConvertedAudios) {
                // Check if this specific converted audio (by its publicId) has been saved by any user
                const isSaved = await SavedAudio.exists({
                    cloudinaryPublicId: convertedAudio.cloudinaryPublicId
                });

                if (!isSaved) {
                    try {
                        await cloudinary.uploader.destroy(convertedAudio.cloudinaryPublicId, { resource_type: 'video' });
                        await ConvertAudio.deleteOne({ _id: convertedAudio._id });
                        console.log(`Deleted unsaved converted audio: ${convertedAudio.cloudinaryPublicId} from Cloudinary and DB.`);
                    } catch (err) {
                        console.error(`Failed to delete unsaved converted audio ${convertedAudio.cloudinaryPublicId}:`, err.message);
                    }
                } else {
                    console.log(`Converted audio ${convertedAudio.cloudinaryPublicId} is saved, skipping temporary deletion.`);
                }
            }

        } catch (error) {
            console.error("Error during scheduled audio cleanup:", error);
        }
    });
};

module.exports = cleanUpOldAudios;