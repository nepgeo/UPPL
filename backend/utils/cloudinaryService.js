const cloudinary = require("../config/cloudinary");

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder   - Target Cloudinary folder
 */
const uploadFileToCloudinary = async (filePath, folder = "uploads") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (err) {
    console.error("❌ Cloudinary upload error:", err.message);
    throw err;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 */
const destroyPublicId = async (publicId) => {
  try {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("❌ Cloudinary delete error:", err.message);
    throw err;
  }
};

module.exports = {
  uploadFileToCloudinary,
  destroyPublicId,
};
