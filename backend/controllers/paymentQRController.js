// backend/controllers/paymentQRController.js
const cloudinary = require("../config/cloudinary");

// ✅ GET all QR codes (list from DB or cache if you store them there)
// For now, we’ll assume you just query DB instead of filesystem
async function getAllQRs(req, res) {
  try {
    // If you’re storing QR codes in MongoDB:
    // const qrs = await QRModel.find();
    // return res.json(qrs);

    // OR if you don’t store in DB and only want to return all from Cloudinary folder:
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "payment-qr/", // folder name in Cloudinary
      resource_type: "image",
    });

    const list = result.resources.map((file) => ({
      url: file.secure_url,
      public_id: file.public_id,
    }));

    return res.json(list);
  } catch (err) {
    console.error("❌ Error fetching QR codes:", err);
    return res.status(500).json({ message: "Failed to fetch QR images" });
  }
}

// ✅ CREATE — upload a new QR image
async function createQR(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "payment-qr",
    });

    return res.status(201).json({
      message: "QR uploaded successfully",
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });
  } catch (err) {
    console.error("❌ createQR error:", err);
    return res.status(500).json({ message: "Failed to upload QR" });
  }
}

// ✅ UPDATE — replace existing QR with new one
async function updateQR(req, res) {
  try {
    const { public_id } = req.params; // pass old QR's public_id in route
    if (!req.file) {
      return res.status(400).json({ message: "No replacement file uploaded" });
    }

    // Delete old QR from Cloudinary
    if (public_id) {
      await cloudinary.uploader.destroy(public_id);
    }

    // Upload new one
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "payment-qr",
    });

    return res.json({
      message: "QR updated successfully",
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });
  } catch (err) {
    console.error("❌ updateQR error:", err);
    return res.status(500).json({ message: "Failed to update QR" });
  }
}

// ✅ DELETE QR by public_id
async function deleteQR(req, res) {
  try {
    const { public_id } = req.params;
    if (!public_id) {
      return res.status(400).json({ message: "public_id is required" });
    }

    await cloudinary.uploader.destroy(public_id);

    return res.json({ message: "QR deleted successfully", public_id });
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
