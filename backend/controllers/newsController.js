const mongoose = require('mongoose');
const News = require('../models/newsModel');
const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary'); // ✅ Cloudinary config

// ==========================
// GET /api/news
// ==========================
const getAllNews = asyncHandler(async (req, res) => {
  try {
    const news = await News.find()
      .populate('author', 'name avatar role bio')
      .sort({ createdAt: -1 });

    res.status(200).json(news);
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ==========================
// GET /api/news/:id
// ==========================
const getNewsById = asyncHandler(async (req, res) => {
  try {
    const news = await News.findById(req.params.id)
      .populate('author', 'name avatar role bio');

    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    res.status(200).json(news);
  } catch (err) {
    console.error('Error fetching news by ID:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ==========================
// POST /api/news
// ==========================
const createNews = asyncHandler(async (req, res) => {
  try {
    const { title, content } = req.body;
    const author = req.body.author || req.user?.id;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    if (!author) {
      return res.status(400).json({ message: 'Author is required' });
    }

    let imageUploads = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "news",
        });
        imageUploads.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    }

    const news = await News.create({
      title,
      content,
      images: imageUploads,
      author,
    });

    res.status(201).json(news);
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ==========================
// PUT /api/news/:id
// ==========================
const updateNews = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid news ID' });
  }

  const news = await News.findById(id);
  if (!news) {
    return res.status(404).json({ message: 'News not found' });
  }

  const { title, content } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  let newImageUploads = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "news",
      });
      newImageUploads.push({
        url: result.secure_url,
        public_id: result.public_id,
      });
    }
  }

  news.title = title;
  news.content = content;
  if (newImageUploads.length > 0) {
    news.images = [...news.images, ...newImageUploads];
  }

  await news.save();

  res.status(200).json({ message: 'News updated successfully', news });
});

// ==========================
// DELETE /api/news/:id
// ==========================
const deleteNews = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid news ID' });
  }

  const news = await News.findById(id);
  if (!news) {
    return res.status(404).json({ message: 'News not found' });
  }

  // ✅ Delete images from Cloudinary
  if (news.images && news.images.length > 0) {
    for (const img of news.images) {
      if (img.public_id) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    }
  }

  await news.deleteOne();

  res.json({ message: 'News deleted successfully' });
});

module.exports = {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
};
