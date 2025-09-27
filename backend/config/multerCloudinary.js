// backend/config/multerCloudinary.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary'); // the file above

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // choose folder based on fieldname
    const baseFolder = 'uppl'; // change as you like
    let folder = `${baseFolder}/others`;
    if (file.fieldname === 'profileImage') folder = `${baseFolder}/profile`;
    if (file.fieldname === 'documents') folder = `${baseFolder}/documents`;

    return {
      folder,
      // public_id: you can define pattern if needed
      public_id: `${file.fieldname}-${Date.now()}`,
      resource_type: 'image', // use 'raw' for non-image files
    };
  },
});

// optional: limit size, filter file types
const fileFilter = (req, file, cb) => {
  // allow images only
  if (/image\/(jpeg|png|jpg|webp)/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 }, // 6 MB
  fileFilter,
});

module.exports = upload;
