// backend/utils/cloudinaryService.js
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

async function uploadFileToCloudinary(localFilePath, folder = "general") {
  try {
    const res = await cloudinary.uploader.upload(localFilePath, {
      folder,
      use_filename: false,
      unique_filename: true,
      overwrite: false,
    });
    // delete local temp file if exists
    try { if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath); } catch(e){}
    return { url: res.secure_url, public_id: res.public_id, raw: res };
  } catch (err) {
    // attempt to cleanup local file on error
    try { if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath); } catch(e){}
    throw err;
  }
}

async function destroyPublicId(public_id, options = {}) {
  if (!public_id) return;
  try {
    await cloudinary.uploader.destroy(public_id, options);
  } catch (err) {
    // don't crash on destroy failure; just log
    console.warn("cloudinary destroy failed", public_id, err.message || err);
  }
}

module.exports = { uploadFileToCloudinary, destroyPublicId };
