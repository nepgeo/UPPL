const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  url: { type: String, required: true },
  embedUrl: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  type: {
    type: String,
    enum: ['youtube', 'vimeo', 'direct', 'embed'],
    default: 'youtube'
  },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Video', VideoSchema);
