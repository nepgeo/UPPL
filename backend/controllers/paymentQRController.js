const cloudinary = require("../config/cloudinary");
const {
  uploadFileToCloudinary,
  destroyPublicId,
} = require("../utils/cloudinaryService");

// ========================
// GET all QR images
// ========================
async function getAllQRs(req, res) {
  try {
    const result = await cloudinary.search
      .expression("folder:payment-qr/*")
      .sort_by("public_id", "desc")
      .max_results(50)
      .execute();

    const list = result.resources.map((file) => ({
      url: file.secure_url,
      public_id: file.public_id,
    }));

    return res.json({ success: true, qrs: list });
  } catch (err) {
    console.error("❌ Error fetching QR codes:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch QR images" });
  }
}

// ========================
// CREATE — expects multer.single('qrImage')
// ========================
async function createQR(req, res) {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const uploaded = await uploadFileToCloudinary(req.file.path, "payment-qr");

    return res.status(201).json({
      success: true,
      message: "✅ QR uploaded successfully",
      qr: uploaded,
    });
  } catch (err) {
    console.error("❌ createQR error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create QR" });
  }
}

// ========================
// UPDATE — replace an existing QR by public_id
// ========================
async function updateQR(req, res) {
  try {
    const { public_id } = req.params;
    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: "public_id parameter is required",
      });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No replacement file uploaded" });
    }

    // Delete old QR from Cloudinary
    await destroyPublicId(public_id);

    // Upload new QR
    const uploaded = await uploadFileToCloudinary(req.file.path, "payment-qr");

    return res.json({
      success: true,
      message: "✅ QR updated successfully",
      oldPublicId: public_id,
      qr: uploaded,
    });
  } catch (err) {
    console.error("❌ updateQR error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update QR" });
  }
}

// ========================
// DELETE — by public_id
// ========================
async function deleteQR(req, res) {
  try {
    const { public_id } = req.params;
    if (!public_id) {
      return res
        .status(400)
        .json({ success: false, message: "public_id is required" });
    }

    const result = await destroyPublicId(public_id);

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "QR not found" });
    }

    return res.json({
      success: true,
      message: "🗑️ QR deleted successfully",
      public_id,
    });
  } catch (err) {
    console.error("❌ deleteQR error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete QR" });
  }
}

module.exports = {
  getAllQRs,
  createQR,
  updateQR,
  deleteQR,
};
