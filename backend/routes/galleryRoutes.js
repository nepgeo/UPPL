const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { upload } = require('../middleware/upload');

// ---------- ALBUM ROUTES ----------
router.post('/albums', galleryController.createAlbum);
router.get('/albums', galleryController.getAlbums);
router.put('/albums/:id', galleryController.updateAlbum);
router.delete('/albums/:id', galleryController.deleteAlbum);

// ---------- IMAGE ROUTES ----------
// Use upload.any() to accept multiple files from any field name
router.post('/images', upload.any(), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Attach files to req.body.images to match your controller logic
    req.body.files = req.files;
    await galleryController.uploadImages(req, res);
  } catch (err) {
    console.error('❌ Image upload route failed:', err);
    res.status(500).json({ message: 'Failed to upload images' });
  }
});

router.get('/images', galleryController.getImages);
router.put('/images/:id', galleryController.updateImage);
router.delete('/images/:id', galleryController.deleteImage);

module.exports = router;
