// backend/routes/newsRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
} = require("../controllers/newsController");
const { protect } = require("../middleware/authMiddleware");
const { multiple } = require("../middleware/upload"); // ✅ use central upload.js

// 🔓 Public Routes
router.get("/", getAllNews);
router.get("/:id", getNewsById);

// 🔐 Protected Routes (with file upload)
router.post("/", protect, multiple("images", 10), createNews);
router.put("/:id", protect, multiple("images", 10), updateNews);
router.delete("/:id", protect, deleteNews);

module.exports = router;
