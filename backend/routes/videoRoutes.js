const express = require('express');
const router = express.Router();
const { protect, requireAdminOrSuperAdmin } = require('../middleware/authMiddleware');
const videoController = require('../controllers/videoController');

// Public
router.get('/videos', videoController.getVideos);
router.get('/videos/:id', videoController.getVideo);

// Admin
router.post('/videos', protect, requireAdminOrSuperAdmin, videoController.createVideo);
router.put('/videos/:id', protect, requireAdminOrSuperAdmin, videoController.updateVideo);
router.delete('/videos/:id', protect, requireAdminOrSuperAdmin, videoController.deleteVideo);

module.exports = router;
