// backend/middleware/upload.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// ✅ Define Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "other";

    switch (file.fieldname) {
      case "profileImage":
        folder = "users/profile";
        break;
      case "documents":
        folder = "users/documents";
        break;
      case "image":
      case "images":
        folder = "gallery";
        break;
      case "logo":
      case "avatar":
        folder = "sponsors";
        break;
      case "teamLogo":
        folder = "teams/logos";
        break;
      case "paymentReceipt":
        folder = "payments/receipts";
        break;
      case "qrImage":
        folder = "payments/qr";
        break;
      case "teamMember":
        folder = "teams/members";
        break;
      default:
        folder = "other";
    }

    return {
      folder,
      public_id: `${file.fieldname}-${Date.now()}`,
      resource_type:
        file.mimetype === "application/pdf" ? "raw" : "image", // ✅ handle PDFs
    };
  },
});

// ✅ Multer instance with Cloudinary storage
const upload = multer({ storage });

// ✅ Field-based middleware
const uploadTeamFiles = () =>
  upload.fields([
    { name: "teamLogo", maxCount: 1 },
    { name: "teamMember", maxCount: 1 },
    { name: "paymentReceipt", maxCount: 1 },
  ]);

const uploadPaymentQR = () =>
  upload.fields([{ name: "qrImage", maxCount: 1 }]);

module.exports = {
  upload,
  uploadTeamFiles,
  uploadPaymentQR,
};
