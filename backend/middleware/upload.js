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

// file filter for images and pdfs
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only image and PDF files are allowed"), false);
  }
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
