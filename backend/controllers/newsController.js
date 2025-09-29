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


// controllers/newsController.js - createNews example
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
        // ✅ match schema: { url, public_id }
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
    res.status(201).json({ message: "News created successfully", news });
  } catch (err) {
    console.error("createNews error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});






// ========================
// POST /api/news
// ========================
// const createNews = asyncHandler(async (req, res) => {
//   try {
//     const { title, content } = req.body;
//     const author = req.body.author || req.user?.id;

//     if (!author) {
//       return res.status(400).json({ message: "Author is required" });
//     }

//     if (!title || !content) {
//       return res
//         .status(400)
//         .json({ message: "Title and content are required" });
//     }

//     let images = [];
//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         const uploaded = await uploadFileToCloudinary(file.path, "news");
//         images.push({
//           url: uploaded.secure_url,
//           public_id: uploaded.public_id,
//         });
//       }
//     }

//     const news = await News.create({
//       title,
//       content,
//       images,
//       author,
//     });

//     res.status(201).json(news);
//   } catch (error) {
//     console.error("❌ Error creating news:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

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

    // ✅ update allowed fields
    const updatable = ["title", "summary", "content"];
    updatable.forEach((k) => {
      if (req.body[k] !== undefined) news[k] = req.body[k];
    });

    // ✅ handle new images
    if (req.files && req.files.length) {
      // delete old ones
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
    res.json({ message: "News updated", news });
  } catch (err) {
    console.error("updateNews error:", err);
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

    // ✅ Clean up Cloudinary images
    if (news.images && news.images.length) {
      for (const img of news.images) {
        if (img.public_id) {
          try {
            await destroyPublicId(img.public_id);
          } catch (err) {
            console.warn("Failed to delete Cloudinary image:", img.public_id, err.message);
          }
        }
      }
    }

    await news.deleteOne();
    res.json({ message: "News deleted successfully" });
  } catch (err) {
    console.error("deleteNews error:", err);
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
