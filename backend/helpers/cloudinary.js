const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer memory storage (in-memory buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = {
  cloudinary,
  upload
}