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
    // required fields
    const { title, summary, content } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content required' });

    const images = [];
    if (req.files && Array.isArray(req.files)) {
      // when route uses multiple("images"), multer sets req.files as array
      for (const file of req.files) {
        try {
          const uploaded = await uploadFileToCloudinary(file.path, 'news');
          images.push({
            url: uploaded.secure_url,
            public_id: uploaded.public_id,
          });
        } catch (err) {
          // log and continue or abort — here we abort to avoid partial state
          console.error('Cloudinary upload failed for file', file.originalname, err.message);
          return res.status(500).json({ message: 'Image upload failed', error: err.message });
        }
      }
    } else if (req.files && req.files.images) {
      // if using fields() with { name: 'images' }
      const arr = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      for (const file of arr) {
        const uploaded = await uploadFileToCloudinary(file.path, 'news');
        images.push({ url: uploaded.secure_url, public_id: uploaded.public_id });
      }
    }

    const newsDoc = new News({
      title,
      summary,
      content,
      images, // store array of {url, public_id}
      author: req.user ? req.user._id : null,
    });

    await newsDoc.save();
    res.status(201).json({ message: 'News created', news: newsDoc });
  } catch (err) {
    console.error('createNews error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
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
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

    const news = await News.findById(id);
    if (!news) return res.status(404).json({ message: 'Not found' });

    // Update fields
    const updatable = ['title','summary','content'];
    updatable.forEach(k => { if (req.body[k] !== undefined) news[k] = req.body[k]; });

    // If new images uploaded, upload and optionally destroy old ones
    const newImages = [];
    if (req.files && req.files.length) {
      // destroy old ones
      if (news.images && news.images.length) {
        for (const old of news.images) {
          if (old.public_id) await destroyPublicId(old.public_id);
        }
      }
      for (const f of req.files) {
        const uploaded = await uploadFileToCloudinary(f.path, 'news');
        newImages.push({ url: uploaded.secure_url, public_id: uploaded.public_id });
      }
      news.images = newImages;
    }

    await news.save();
    res.json({ message: 'News updated', news });
  } catch (err) {
    console.error('updateNews error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
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
