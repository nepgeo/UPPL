const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads'); // base uploads folder

// ✅ Ensure upload folders exist
const folders = [
  path.join(UPLOADS_DIR, 'profile'),
  path.join(UPLOADS_DIR, 'documents'),
  path.join(UPLOADS_DIR, 'gallery'),
  path.join(UPLOADS_DIR, 'sponsors'),
  path.join(UPLOADS_DIR, 'teamLogos'),
  path.join(UPLOADS_DIR, 'other'),
  path.join(UPLOADS_DIR, 'receipts'),
  path.join(UPLOADS_DIR, 'payment-qr'),
  path.join(UPLOADS_DIR, 'teamMembers'),
];

folders.forEach(folder => {
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
});

// ✅ Storage configuration based on field name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const field = file.fieldname;

    if (field === 'profileImage') {
      cb(null, path.join(UPLOADS_DIR, 'profile'));
    } else if (field === 'documents') {
      cb(null, path.join(UPLOADS_DIR, 'documents'));
    } else if (field === 'image' || field === 'images') {
      cb(null, path.join(UPLOADS_DIR, 'gallery'));
    } else if (field === 'logo' || field === 'avatar') {
      cb(null, path.join(UPLOADS_DIR, 'sponsors'));
    } else if (field === 'teamLogo') {
      cb(null, path.join(UPLOADS_DIR, 'teamLogos'));
    } else if (field === 'paymentReceipt') {
      cb(null, path.join(UPLOADS_DIR, 'receipts'));
    } else if (field === 'qrImage') {
      cb(null, path.join(UPLOADS_DIR, 'payment-qr'));
    } else if (field === 'teamMember') {
      cb(null, path.join(UPLOADS_DIR, 'teamMembers'));
    } else {
      cb(null, path.join(UPLOADS_DIR, 'other'));
    }
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    const unique = `${base}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  }
});

// ✅ File filter (allow images and PDFs only)
const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDFs are allowed'), false);
  }
};

// ✅ Main multer upload instance
const upload = multer({ storage, fileFilter });

// ✅ Specific middleware for team file uploads
const uploadTeamFiles = () =>
  upload.fields([
    { name: 'teamLogo', maxCount: 1 },
    { name: 'teamMember', maxCount: 1 },
    { name: 'paymentReceipt', maxCount: 1 },
  ]);

// ✅ Middleware for payment QR uploads
const uploadPaymentQR = () =>
  upload.fields([
    { name: 'qrImage', maxCount: 1 } // match the frontend field name
  ]);

module.exports = {
  upload,
  uploadTeamFiles,
  uploadPaymentQR,
};
