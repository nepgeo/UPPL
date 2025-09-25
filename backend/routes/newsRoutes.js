const express = require('express');
const router = express.Router();
const {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
} = require('../controllers/newsController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// 🔧 Multer Configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/news');
  },
  filename(req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// 🔓 Public Routes
router.get('/', getAllNews);
router.get('/:id', getNewsById);

// 🔐 Protected Routes (require login)
router.post('/', protect, upload.array('images', 10), createNews);
router.put('/:id', protect, upload.array('images', 10), updateNews);
router.delete('/:id', protect, deleteNews);

module.exports = router;
