const mongoose = require("mongoose");
const News = require("../models/newsModel");
const asyncHandler = require("express-async-handler");
const {
  uploadFileToCloudinary,
  destroyPublicId,
} = require("../utils/cloudinaryService");

// ========================
// GET /api/news
// ========================
const getAllNews = asyncHandler(async (req, res) => {
  try {
    const news = await News.find()
      .populate("author", "name avatar role bio")
      .sort({ createdAt: -1 });

    res.status(200).json(news);
  } catch (err) {
    console.error("❌ Error fetching news:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ========================
// GET /api/news/:id
// ========================
const getNewsById = asyncHandler(async (req, res) => {
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
});

// ========================
// POST /api/news
// ========================
const createNews = asyncHandler(async (req, res) => {
  try {
    const { title, content } = req.body;
    const author = req.body.author || req.user?.id;

    if (!author) {
      return res.status(400).json({ message: "Author is required" });
    }

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadFileToCloudinary(file.path, "news");
        images.push({
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
        });
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
});

// ========================
// PUT /api/news/:id
// ========================
const updateNews = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid news ID" });
  }

  const { title, content } = req.body;

  const news = await News.findById(id);
  if (!news) {
    return res.status(404).json({ message: "News not found" });
  }

  let newImages = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploaded = await uploadFileToCloudinary(file.path, "news");
      newImages.push({
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      });
    }
  }

  // Update fields
  if (title) news.title = title;
  if (content) news.content = content;
  if (newImages.length > 0) {
    news.images = [...news.images, ...newImages];
  }

  await news.save();

  res.status(200).json({ message: "✅ News updated successfully", news });
});

// ========================
// DELETE /api/news/:id
// ========================
const deleteNews = asyncHandler(async (req, res) => {
  const { id } = req.params;

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
      if (img.public_id) {
        await destroyPublicId(img.public_id);
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
