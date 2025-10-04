// backend/controllers/paymentQRController.js
const cloudinary = require("../config/cloudinary");
const { uploadFileToCloudinary, destroyPublicId } = require("../utils/cloudinaryService");
const PaymentQR = require("../models/paymentQRModel"); // ✅ Import model

// ========================
// GET all QR images
// ========================
async function getAllQRs(req, res) {
  try {
    const qrs = await PaymentQR.find().sort({ createdAt: -1 }); // ✅ Fetch from DB
    return res.json(qrs);
  } catch (err) {
    console.error("❌ Error fetching QR codes:", err);
    return res.status(500).json({ message: "Failed to fetch QR images" });
  }
}

// ========================
// CREATE — expects multer.single('qrImage')
// ========================
async function createQR(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const uploaded = await uploadFileToCloudinary(req.file.path, "payment-qr");

    // ✅ Save in MongoDB
    const newQR = await PaymentQR.create({
      url: uploaded.url,
      public_id: uploaded.public_id,
    });

    return res.status(201).json({
      success: true,
      message: "✅ QR uploaded and saved successfully",
      qr: newQR,
    });
  } catch (err) {
    console.error("❌ createQR error:", err);
    return res.status(500).json({ success: false, message: "Failed to create QR" });
  }
}

// ========================
// UPDATE — replace an existing QR by public_id
// ========================
async function updateQR(req, res) {
  try {
    const { public_id } = req.params;
    if (!public_id) {
      return res.status(400).json({ success: false, message: "public_id parameter is required" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No replacement file uploaded" });
    }

    await destroyPublicId(public_id);
    const uploaded = await uploadFileToCloudinary(req.file.path, "payment-qr");

    // ✅ Update DB entry
    const updatedQR = await PaymentQR.findOneAndUpdate(
      { public_id },
      { url: uploaded.url, public_id: uploaded.public_id },
      { new: true }
    );

    return res.json({
      success: true,
      message: "✅ QR updated successfully",
      qr: updatedQR,
    });
  } catch (err) {
    console.error("❌ updateQR error:", err);
    return res.status(500).json({ success: false, message: "Failed to update QR" });
  }
}

// ========================
// DELETE — by public_id
// ========================
async function deleteQR(req, res) {
  try {
    let { public_id } = req.params;
    if (!public_id) {
      return res.status(400).json({ success: false, message: "public_id is required" });
    }

    public_id = public_id.replace(/\.(jpg|jpeg|png)$/i, "");
    if (!public_id.startsWith("payment-qr/")) {
      public_id = `payment-qr/${public_id}`;
    }

    const result = await destroyPublicId(public_id);

    if (!result) {
      console.error("❌ Cloudinary returned undefined for public_id:", public_id);
      return res.status(500).json({ success: false, message: "Failed to delete QR" });
    }

    // ✅ Delete from MongoDB as well
    await PaymentQR.findOneAndDelete({ public_id });

    return res.json({
      success: true,
      message: "🗑️ QR deleted successfully from Cloudinary & DB",
      public_id,
    });
  } catch (err) {
    console.error("❌ deleteQR error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete QR" });
  }
}

module.exports = {
  getAllQRs,
  createQR,
  updateQR,
  deleteQR,
};
