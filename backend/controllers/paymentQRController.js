// backend/controllers/paymentQRController.js
const cloudinary = require("../config/cloudinary");

// ========================
// GET all QR images
// ========================
async function getAllQRs(req, res) {
  try {
    // Search all QR codes under "payment-qr" folder in Cloudinary
    const result = await cloudinary.search
      .expression("folder:payment-qr/*")
      .sort_by("public_id", "desc")
      .max_results(50)
      .execute();

    // Format as [{ url, public_id }]
    const list = result.resources.map((file) => ({
      url: file.secure_url,
      public_id: file.public_id,
    }));

    return res.json(list);
  } catch (err) {
    console.error("❌ Error fetching QR codes from Cloudinary:", err);
    return res.status(500).json({ message: "Failed to fetch QR images" });
  }
}

// ========================
// CREATE — expects multer single('qrImage')
// ========================
async function createQR(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadRes = await cloudinary.uploader.upload(req.file.path, {
      folder: "payment-qr",
      resource_type: "image",
    });

    return res.status(201).json({
      message: "✅ QR uploaded successfully",
      qr: { url: uploadRes.secure_url, public_id: uploadRes.public_id },
    });
  } catch (err) {
    console.error("❌ createQR error:", err);
    return res.status(500).json({ message: "Failed to create QR" });
  }
}

// ========================
// UPDATE — replace an existing QR by public_id
// ========================
async function updateQR(req, res) {
  try {
    const { public_id } = req.params;
    if (!public_id) {
      return res
        .status(400)
        .json({ message: "public_id parameter is required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No replacement file uploaded" });
    }

    // Delete old QR from Cloudinary
    await cloudinary.uploader.destroy(public_id);

    // Upload new QR
    const uploadRes = await cloudinary.uploader.upload(req.file.path, {
      folder: "payment-qr",
      resource_type: "image",
    });

    return res.json({
      message: "✅ QR updated successfully",
      oldPublicId: public_id,
      qr: { url: uploadRes.secure_url, public_id: uploadRes.public_id },
    });
  } catch (err) {
    console.error("❌ updateQR error:", err);
    return res.status(500).json({ message: "Failed to update QR" });
  }
}

// ========================
// DELETE — by public_id
// ========================
async function deleteQR(req, res) {
  try {
    const { public_id } = req.params;
    if (!public_id) {
      return res.status(400).json({ message: "public_id is required" });
    }

    const result = await cloudinary.uploader.destroy(public_id);
    if (result.result !== "ok") {
      return res.status(404).json({ message: "QR not found" });
    }

    return res.json({
      message: "🗑️ QR deleted successfully",
      public_id,
    });
  } catch (err) {
    console.error("❌ deleteQR error:", err);
    return res.status(500).json({ message: "Failed to delete QR" });
  }
}

module.exports = {
  getAllQRs,
  createQR,
  updateQR,
  deleteQR,
};
