const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    images: [{ type: String }],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // 👈 This assumes your user model is called 'User'
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('News', newsSchema);
