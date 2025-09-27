const mongoose = require("mongoose");
const News = require("../models/newsModel");
const asyncHandler = require("express-async-handler");
const cloudinary = require("../config/cloudinary"); // ✅ direct Cloudinary

// ========================
// GET /api/news
// ========================
const getAllNews = async (req, res) => {
  try {
    const news = await News.find()
      .populate("author", "name avatar role bio")
      .sort({ createdAt: -1 });

    res.status(200).json(news);
  } catch (err) {
    console.error("❌ Error fetching news:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// ========================
// GET /api/news/:id
// ========================
const getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id).populate(
      "author",
      "name avatar role bio"
    );

    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    res.status(200).json(news);
  } catch (err) {
    console.error("❌ Error fetching news by ID:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// ========================
// POST /api/news
// ========================
const createNews = async (req, res) => {
  try {
    const { title, content } = req.body;
    const author = req.body.author || req.user?.id;

    if (!author) {
      return res.status(400).json({ message: "Author is required" });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadRes = await cloudinary.uploader.upload(file.path, {
          folder: "news",
          resource_type: "image",
        });
        images.push({ url: uploadRes.secure_url, public_id: uploadRes.public_id });
      }
    }

    const news = await News.create({
      title,
      content,
      images,
      author,
    });

    res.status(201).json(news);
  } catch (error) {
    console.error("❌ Error creating news:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ========================
// PUT /api/news/:id
// ========================
const updateNews = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid news ID" });
  }

  const { title, content } = req.body || {};

  if (!title || !content) {
    return res
      .status(400)
      .json({ message: "Title and content are required" });
  }

  const news = await News.findById(id);
  if (!news) {
    return res.status(404).json({ message: "News not found" });
  }

  let newImages = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploadRes = await cloudinary.uploader.upload(file.path, {
        folder: "news",
        resource_type: "image",
      });
      newImages.push({ url: uploadRes.secure_url, public_id: uploadRes.public_id });
    }
  }

  news.title = title;
  news.content = content;
  if (newImages.length > 0) {
    news.images = [...news.images, ...newImages];
  }

  await news.save();

  res
    .status(200)
    .json({ message: "✅ News updated successfully", news });
});

// ========================
// DELETE /api/news/:id
// ========================
const deleteNews = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid news ID" });
  }

  const news = await News.findById(id);
  if (!news) {
    return res.status(404).json({ message: "News not found" });
  }

  // ✅ Delete images from Cloudinary
  if (news.images && news.images.length > 0) {
    for (const img of news.images) {
      try {
        await cloudinary.uploader.destroy(img.public_id);
      } catch (err) {
        console.warn("⚠️ Failed to delete image from Cloudinary:", err.message);
      }
    }
  }

  await news.deleteOne();

  res.json({ message: "🗑️ News deleted successfully" });
});

module.exports = {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
};
