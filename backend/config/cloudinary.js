// backend/config/cloudinary.js
const cloudinary = require('cloudinary').v2;

console.log("☁️ Cloudinary env check:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "SET" : "MISSING",
  api_key: process.env.CLOUDINARY_API_KEY ? "SET" : "MISSING",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "MISSING",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = cloudinary;
