const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  name: String,
  description: String,
  season: String,
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Album', albumSchema);
