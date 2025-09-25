const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const {upload} = require('../middleware/upload');


// Albums
router.post('/albums', galleryController.createAlbum);
router.get('/albums', galleryController.getAlbums);
router.put('/albums/:id', galleryController.updateAlbum);
router.delete('/albums/:id', galleryController.deleteAlbum);

// Images
router.post('/images', upload.array('images'), galleryController.uploadImages);

// router.post('/images', upload.single('image'), galleryController.uploadImage);
//router.post('/images', upload.array('images', 500), galleryController.uploadImage);

router.get('/images', galleryController.getImages);
router.put('/images/:id', galleryController.updateImage);
router.delete('/images/:id', galleryController.deleteImage);

module.exports = router;
