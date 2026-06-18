const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
  title: { type: String, required: true },

  image: {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
  },

  tags: [String],
  uploadDate: { type: Date, default: Date.now },
  isPublic: { type: Boolean, default: true },

  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album',
    required: true,
  },
});

module.exports = mongoose.model('GalleryImage', galleryImageSchema);
