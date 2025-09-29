const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    summary: { type: String }, // optional preview
    content: { type: String, required: true },

    // ✅ Store Cloudinary images as {url, public_id}
    images: [
      {
        url: { type: String },
        public_id: { type: String },
      },
    ],

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // 👈 Links to User model
    },
  },
  { timestamps: true }
);

// ✅ Index for faster sorting
newsSchema.index({ createdAt: -1 });

// ✅ Virtual for formatted date
newsSchema.virtual('formattedDate').get(function () {
  return this.createdAt
    ? this.createdAt.toLocaleDateString()
    : null;
});

newsSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('News', newsSchema);
