// backend/routes/paymentQRRoutes.js
const express = require("express");
const router = express.Router();

const paymentQRController = require("../controllers/paymentQRController");
const { protect, requireAdminOrSuperAdmin } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/upload"); // use upload.single('qrImage')

// Public read (no auth)
router.get("/", paymentQRController.getAllQRs);

// Create (admin)
router.post(
  "/",
  protect,
  requireAdminOrSuperAdmin,
  upload.single("qrImage"),
  paymentQRController.createQR
);

// Update (admin) - replace existing by filename
// PUT /api/payment-qr/:filename  (body contains multipart file 'qrImage')
router.put(
  "/:filename",
  protect,
  requireAdminOrSuperAdmin,
  upload.single("qrImage"),
  paymentQRController.updateQR
);

// Delete (admin) by filename
// DELETE /api/payment-qr/:filename
router.delete(
  "/:filename",
  protect,
  requireAdminOrSuperAdmin,
  paymentQRController.deleteQR
);

module.exports = router;
