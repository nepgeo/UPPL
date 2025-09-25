// backend/controllers/paymentQRController.js
const path = require("path");
const fs = require("fs-extra");

const uploadDir = path.join(__dirname, "..", "uploads", "payment-qr");
fs.ensureDirSync(uploadDir);

// GET all QR images (returns array of { filename })
// GET all QR images (returns array of full URLs)
async function getAllQRs(req, res) {
  try {
    const files = await fs.readdir(uploadDir);
    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/payment-qr`;

    // Send full URLs instead of just filenames
    const list = files.map((filename) => `${baseUrl}/${filename}`);
    return res.json(list);
  } catch (err) {
    console.error("❌ Error reading QR folder:", err);
    return res.status(500).json({ message: "Failed to fetch QR images" });
  }
}

// CREATE — expects multer single('qrImage') to populate req.file
async function createQR(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // multer already saved the file in uploadDir
    return res.status(201).json({ filename: req.file.filename });
  } catch (err) {
    console.error("❌ createQR error:", err);
    return res.status(500).json({ message: "Failed to create QR" });
  }
}

// UPDATE — replace an existing file (/:filename) with a new uploaded file
// (This deletes the old file from disk and returns the new filename)
async function updateQR(req, res) {
  try {
    const { filename: oldFilename } = req.params;
    if (!oldFilename) {
      return res.status(400).json({ message: "Filename parameter is required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No replacement file uploaded" });
    }

    const oldPath = path.join(uploadDir, oldFilename);
    if (await fs.pathExists(oldPath)) {
      await fs.remove(oldPath);
    }

    // new file already saved by multer as req.file.filename
    return res.json({ oldFilename, filename: req.file.filename });
  } catch (err) {
    console.error("❌ updateQR error:", err);
    return res.status(500).json({ message: "Failed to update QR" });
  }
}

// DELETE by filename
async function deleteQR(req, res) {
  try {
    const { filename } = req.params;
    if (!filename) {
      return res.status(400).json({ message: "Filename is required" });
    }

    const filePath = path.join(uploadDir, filename);

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ message: "File not found" });
    }

    await fs.remove(filePath);

    // Optional: if you keep any in-memory or metadata, update here.
    return res.json({ message: "QR deleted successfully", filename });
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
