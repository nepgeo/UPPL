// backend/middleware/upload.js
const multer = require("multer");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

// temp folder for multer
const tmpDir = path.join(os.tmpdir(), "uppl-uploads");
const fs = require("fs");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

// disk storage (temporary)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) =>
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

// file filter - accept all file types (Cloudinary handles resource_type: auto)
const fileFilter = (req, file, cb) => {
  cb(null, true);
};

// 20MB limit
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// exported helpers to use in controllers
module.exports = {
  upload,
  // convenience middlewares for common combinations:
  single: (fieldName) => upload.single(fieldName),
  multiple: (fieldName, maxCount = 10) => upload.array(fieldName, maxCount),
  fields: (fields) => upload.fields(fields),
};
