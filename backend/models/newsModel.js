const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },

    // ✅ Store Cloudinary images as {url, public_id}
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // 👈 Links to User model
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('News', newsSchema);
