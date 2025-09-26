// backend/middleware/upload.js
const multer = require("multer");

// ✅ Use memory storage (keeps files in RAM → req.file.buffer / req.files[field][0].buffer)
const storage = multer.memoryStorage();

// ✅ File filter (allow only images + PDFs)
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, WEBP, and PDF files are allowed"), false);
  }
};

// ✅ Main multer upload instance
const upload = multer({ storage, fileFilter });

// ✅ Middleware for team file uploads
const uploadTeamFiles = () =>
  upload.fields([
    { name: "teamLogo", maxCount: 1 },
    { name: "teamMember", maxCount: 1 },
    { name: "paymentReceipt", maxCount: 1 },
  ]);

// ✅ Middleware for payment QR uploads
const uploadPaymentQR = () =>
  upload.fields([{ name: "qrImage", maxCount: 1 }]);

module.exports = {
  upload,
  uploadTeamFiles,
  uploadPaymentQR,
};
