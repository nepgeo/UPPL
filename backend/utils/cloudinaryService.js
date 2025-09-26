// backend/utils/cloudinaryService.js
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const uploadFile = (filePath, folder = 'uppl') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, { folder }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

/**
 * Upload multer-saved file, then delete local file.
 * file: multer file object with .path property
 * folder: Cloudinary folder name (e.g. 'uppl/news')
 */
const uploadAndRemoveLocal = async (file, folder = 'uppl') => {
  const result = await uploadFile(file.path, folder);
  try {
    fs.unlinkSync(file.path);
  } catch (err) {
    // non-fatal: log for debugging
    // keep going even if local delete fails
    console.warn('Could not delete local file:', file.path, err?.message || err);
  }
  return result; // result.secure_url, result.public_id, etc.
};

const destroy = async (public_id) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(public_id, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};

module.exports = {
  uploadFile,
  uploadAndRemoveLocal,
  destroy,
};
