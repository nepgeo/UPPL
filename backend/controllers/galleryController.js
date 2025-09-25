const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Album = require('../models/Album');
const GalleryImage = require('../models/galleryImage');

// ========== ALBUM HANDLERS ==========

exports.createAlbum = async (req, res) => {
  try {
    const album = new Album(req.body);
    await album.save();
    res.status(201).json(album);
  } catch (err) {
    console.error('Create album failed:', err);
    res.status(500).json({ message: 'Failed to create album' });
  }
};

exports.getAlbums = async (req, res) => {
  try {
    const albums = await Album.find();
    res.json(albums);
  } catch (err) {
    console.error('Get albums failed:', err);
    res.status(500).json({ message: 'Failed to fetch albums' });
  }
};

exports.updateAlbum = async (req, res) => {
  try {
    const updated = await Album.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('Update album failed:', err);
    res.status(500).json({ message: 'Failed to update album' });
  }
};

exports.deleteAlbum = async (req, res) => {
  try {
    const images = await GalleryImage.find({ album: req.params.id });

    for (const image of images) {
      const imagePath = path.join(__dirname, '..', image.url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await GalleryImage.deleteMany({ album: req.params.id });
    await Album.findByIdAndDelete(req.params.id);
    res.json({ message: 'Album and its images deleted.' });
  } catch (err) {
    console.error('Delete album failed:', err);
    res.status(500).json({ message: 'Failed to delete album' });
  }
};

// ========== IMAGE HANDLERS ==========

exports.uploadImages = async (req, res) => {
  try {
    const { title, albumId, tags } = req.body;
    const files = req.files;

    const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

    const savedImages = await Promise.all(
      files.map((file) => {
        const image = new GalleryImage({
          title,
          album: new mongoose.Types.ObjectId(albumId),
          tags: tagArray,
          url: file.path.replace(/\\/g, '/'),
        });
        return image.save();
      })
    );

    res.status(201).json({
      message: `${savedImages.length} image(s) uploaded successfully`,
      images: savedImages,
    });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ message: 'Failed to upload images' });
  }
};

exports.getImages = async (req, res) => {
  try {
    const { page = 1, limit = 20, tag, season, sortBy = 'createdAt', order = 'desc' } = req.query;

    const match = {};
    if (tag) match.tags = tag;

    const sortOption = {};
    sortOption[sortBy] = order === 'asc' ? 1 : -1;

    const images = await GalleryImage.find(match)
      .populate({
        path: 'album',
        match: season ? { isPublic: true, season } : { isPublic: true }
      })
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const filtered = images.filter(img => img.album !== null);
    res.json(filtered);
  } catch (err) {
    console.error('Fetch images error:', err);
    res.status(500).json({ message: 'Failed to fetch images' });
  }
};

exports.updateImage = async (req, res) => {
  try {
    const updated = await GalleryImage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('Update image failed:', err);
    res.status(500).json({ message: 'Failed to update image' });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const imagePath = path.join(__dirname, '..', image.url);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await GalleryImage.findByIdAndDelete(req.params.id);
    res.json({ message: 'Image deleted.' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Failed to delete image' });
  }
};

// ========== EXPORT HANDLER ==========

exports.downloadImage = async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const filePath = path.join(__dirname, '..', image.url);
    res.download(filePath);
  } catch (err) {
    console.error('Download image failed:', err);
    res.status(500).json({ message: 'Failed to download image' });
  }
};
