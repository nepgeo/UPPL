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

// Update (admin) - replace existing by public_id
// PUT /api/payment-qr/:public_id  (multipart file 'qrImage')
router.put(
  "/:public_id",
  protect,
  requireAdminOrSuperAdmin,
  upload.single("qrImage"),
  paymentQRController.updateQR
);

// Delete (admin) by public_id
// DELETE /api/payment-qr/:public_id
router.delete(
  "/",
  protect,
  requireAdminOrSuperAdmin,
  paymentQRController.deleteQR
);

module.exports = router;
