const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads'); // base uploads folder

// ✅ Ensure upload folders exist
const folders = [
  'profile',
  'documents',
  'gallery',
  'sponsors',
  'teamLogos',
  'other',
  'receipts',
  'payment-qr',
  'teamMembers',
];

folders.forEach(folder => {
  const fullPath = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// ✅ Storage configuration based on field name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'other';

    switch (file.fieldname) {
      case 'profileImage':
        subfolder = 'profile';
        break;
      case 'documents':
        subfolder = 'documents';
        break;
      case 'image':
      case 'images':
        subfolder = 'gallery';
        break;
      case 'logo':
      case 'avatar':
        subfolder = 'sponsors';
        break;
      case 'teamLogo':
        subfolder = 'teamLogos';
        break;
      case 'paymentReceipt':
        subfolder = 'receipts';
        break;
      case 'qrImage':
        subfolder = 'payment-qr';
        break;
      case 'teamMember':
        subfolder = 'teamMembers';
        break;
      default:
        subfolder = 'other';
    }

    cb(null, path.join(UPLOADS_DIR, subfolder));
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, '-');
    const unique = `${base}-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${ext}`;
    cb(null, unique);
  },
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
  upload.fields([{ name: 'qrImage', maxCount: 1 }]);

module.exports = {
  upload,
  uploadTeamFiles,
  uploadPaymentQR,
};
