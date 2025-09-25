const mongoose = require('mongoose');
const Album = require('../models/Album');

const galleryImageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  tags: [String],
  uploadDate: { type: Date, default: Date.now },
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album', // ✅ Corrected model name
    required: true,
  },
});

module.exports = mongoose.model('GalleryImage', galleryImageSchema);
