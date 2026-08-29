const express = require("express");
const router = express.Router();
const {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  incrementView,
  bulkUpdateStatus,
  bulkDelete,
} = require("../controllers/newsController");
const { protect } = require("../middleware/authMiddleware");
const { multiple } = require("../middleware/upload");

router.get("/", getAllNews);
router.get("/:id", getNewsById);

router.post("/", protect, multiple("images", 10), createNews);
router.put("/:id", protect, multiple("images", 10), updateNews);
router.delete("/:id", protect, deleteNews);

router.patch("/:id/view", incrementView);
router.patch("/bulk/status", protect, bulkUpdateStatus);
router.post("/bulk/delete", protect, bulkDelete);

module.exports = router;
