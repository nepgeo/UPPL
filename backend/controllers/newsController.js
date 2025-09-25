const mongoose = require('mongoose');

const News = require('../models/newsModel');
const asyncHandler = require('express-async-handler');

// GET /api/news
const getAllNews = async (req, res) => {
  try {
    const news = await News.find()
      .populate('author', 'name avatar role bio') // 👈 now includes role & bio
      .sort({ createdAt: -1 });

    res.status(200).json(news);
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/news/:id
const getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id)
      .populate('author', 'name avatar role bio'); // 👈 now includes role & bio

    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    res.status(200).json(news);
  } catch (err) {
    console.error('Error fetching news by ID:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// POST /api/news
const createNews = async (req, res) => {
  try {
    const { title, content } = req.body;
    const author = req.body.author || req.user?.id;

    if (!author) {
      return res.status(400).json({ message: 'Author is required' });
    }

    const imagePaths = req.files ? req.files.map(file => file.path.replace(/\\/g, '/')) : [];

    const news = await News.create({
      title,
      content,
      images: imagePaths,
      author,
    });

    res.status(201).json(news);
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/news/:id
const updateNews = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid news ID' });
  }

  // ✅ Fallback in case req.body is undefined
  const { title, content } = req.body || {};

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  const news = await News.findById(id);

  if (!news) {
    return res.status(404).json({ message: 'News not found' });
  }

  // Handle image updates
  const newImagePaths = req.files?.map((file) => `/uploads/news/${file.filename}`) || [];

  news.title = title;
  news.content = content;
  if (newImagePaths.length > 0) {
    news.images = [...news.images, ...newImagePaths];
  }

  await news.save();

  res.status(200).json({ message: 'News updated successfully', news });
});


// DELETE /api/news/:id
const deleteNews = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid news ID' });
  }

  const news = await News.findById(id);
  if (!news) {
    return res.status(404).json({ message: 'News not found' });
  }

  await news.deleteOne(); // ✅ Use deleteOne instead of remove

  res.json({ message: 'News deleted' });
});


module.exports = {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
};
