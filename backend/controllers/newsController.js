const mongoose = require("mongoose");
const News = require("../models/newsModel");
const asyncHandler = require("express-async-handler");
const {
  uploadFileToCloudinary,
  destroyPublicId,
} = require("../utils/cloudinaryService");

// Helper: normalize news object
const formatNews = (n) => ({
  ...n.toObject(),
  images: n.images?.map((img) =>
    typeof img === "object" ? { url: img.url, public_id: img.public_id } : { url: img }
  ) || [],
  formattedDate: n.createdAt
    ? new Date(n.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null,
});

// ========================
// GET /api/news
// ========================
const getAllNews = asyncHandler(async (req, res) => {
  try {
    const news = await News.find()
      .populate("author", "name avatar role bio")
      .sort({ createdAt: -1 });

    res.status(200).json(news.map(formatNews));
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

    res.status(200).json(formatNews(news));
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
    const { title, summary, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const newImages = [];
    if (req.files && req.files.length) {
      for (const f of req.files) {
        const uploaded = await uploadFileToCloudinary(f.path, "news");
        newImages.push({ url: uploaded.url, public_id: uploaded.public_id });
      }
    }

    const news = new News({
      title,
      summary,
      content,
      images: newImages,
      author: req.user ? req.user._id : null,
    });

    await news.save();
    res.status(201).json(formatNews(news));
  } catch (err) {
    console.error("❌ createNews error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ========================
// PUT /api/news/:id
// ========================
const updateNews = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const news = await News.findById(id);
    if (!news) return res.status(404).json({ message: "Not found" });

    // Update allowed fields
    const updatable = ["title", "summary", "content"];
    updatable.forEach((k) => {
      if (req.body[k] !== undefined) news[k] = req.body[k];
    });

    // Handle new images
    if (req.files && req.files.length) {
      if (news.images && news.images.length) {
        for (const old of news.images) {
          if (old.public_id) await destroyPublicId(old.public_id);
        }
      }

      const newImages = [];
      for (const f of req.files) {
        const uploaded = await uploadFileToCloudinary(f.path, "news");
        newImages.push({ url: uploaded.url, public_id: uploaded.public_id });
      }
      news.images = newImages;
    }

    await news.save();
    res.json(formatNews(news));
  } catch (err) {
    console.error("❌ updateNews error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ========================
// DELETE /api/news/:id
// ========================
const deleteNews = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const news = await News.findById(id);
    if (!news) return res.status(404).json({ message: "Not found" });

    // Clean up Cloudinary images
    if (news.images && news.images.length) {
      for (const img of news.images) {
        if (img.public_id) {
          try {
            await destroyPublicId(img.public_id);
          } catch (err) {
            console.warn("⚠️ Failed to delete Cloudinary image:", img.public_id, err.message);
          }
        }
      }
    }

    await news.deleteOne();
    res.json({ message: "News deleted successfully" });
  } catch (err) {
    console.error("❌ deleteNews error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
};
