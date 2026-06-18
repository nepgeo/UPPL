const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true },
    summary: { type: String },
    metaDescription: { type: String },
    content: { type: String, required: true },
    category: { type: String, default: 'General' },
    tags: [String],
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published', 'scheduled'], default: 'published' },
    publishAt: { type: Date },
    views: { type: Number, default: 0 },

    images: [
      {
        url: { type: String },
        public_id: { type: String },
      },
    ],

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    source: {
      type: String,
      enum: ['internal', 'external'],
      default: 'internal',
    },
    sourceUrl: { type: String },
    externalAuthor: { type: String },
  },
  { timestamps: true }
);

newsSchema.index({ createdAt: -1 });

newsSchema.virtual('formattedDate').get(function () {
  return this.createdAt
    ? this.createdAt.toLocaleDateString()
    : null;
});

newsSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('News', newsSchema);
