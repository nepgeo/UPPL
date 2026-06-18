const mongoose = require("mongoose");
const News = require("../models/newsModel");
const asyncHandler = require("express-async-handler");
const {
  uploadFileToCloudinary,
  destroyPublicId,
} = require("../utils/cloudinaryService");

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

const generateUniqueSlug = async (title, excludeId) => {
  let slug = slugify(title);
  if (!slug) slug = "article";
  let exists = await News.findOne({ slug, _id: { $ne: excludeId || null } });
  let counter = 1;
  while (exists) {
    slug = `${slugify(title)}-${counter}`;
    exists = await News.findOne({ slug, _id: { $ne: excludeId || null } });
    counter++;
  }
  return slug;
};

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

const getAllNews = asyncHandler(async (req, res) => {
  try {
    const { status, category, page: pageStr, limit: limitStr } = req.query;
    const page = Math.max(1, parseInt(pageStr) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(limitStr) || 12));
    const skip = (page - 1) * limit;

    // Auto-publish scheduled articles whose publishAt has passed
    await News.updateMany(
      { status: "scheduled", publishAt: { $lte: new Date() } },
      { $set: { status: "published" }, $unset: { publishAt: "" } }
    );

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const [news, total] = await Promise.all([
      News.find(filter)
        .populate("author", "name profileImage role bio")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      News.countDocuments(filter),
    ]);

    res.status(200).json({
      articles: news.map(formatNews),
      page,
      limit,
      total,
      hasMore: skip + news.length < total,
    });
  } catch (err) {
    console.error("Error fetching news:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

const getNewsById = asyncHandler(async (req, res) => {
  try {
    let news = await News.findById(req.params.id).populate(
      "author",
      "name avatar role bio"
    );

    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    // Auto-publish if scheduled and publishAt has passed
    if (news.status === "scheduled" && news.publishAt && news.publishAt <= new Date()) {
      news.status = "published";
      news.publishAt = undefined;
      await news.save();
    }

    res.status(200).json(formatNews(news));
  } catch (err) {
    console.error("Error fetching news by ID:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

const createNews = asyncHandler(async (req, res) => {
  try {
    const { title, summary, metaDescription, content, category, tags, featured, status, publishAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const slug = await generateUniqueSlug(title);

    const newImages = [];
    if (req.files && req.files.length) {
      for (const f of req.files) {
        const uploaded = await uploadFileToCloudinary(f.path, "news");
        newImages.push({ url: uploaded.url, public_id: uploaded.public_id });
      }
    }

    const news = new News({
      title,
      slug,
      summary,
      metaDescription,
      content,
      category: category || "General",
      tags: tags ? (typeof tags === "string" ? JSON.parse(tags) : tags) : [],
      featured: featured === "true" || featured === true,
      status: status || "published",
      publishAt: publishAt || undefined,
      images: newImages,
      author: req.user ? req.user._id : null,
    });

    await news.save();
    res.status(201).json(formatNews(news));
  } catch (err) {
    console.error("createNews error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

const updateNews = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const news = await News.findById(id);
    if (!news) return res.status(404).json({ message: "Not found" });

    const updatable = ["title", "summary", "metaDescription", "content", "category", "featured", "status", "publishAt"];
    updatable.forEach((k) => {
      if (req.body[k] !== undefined) {
        if (k === "featured") {
          news[k] = req.body[k] === "true" || req.body[k] === true;
        } else if (k === "publishAt") {
          news[k] = req.body[k] || undefined;
        } else {
          news[k] = req.body[k];
        }
      }
    });

    if (req.body.title && req.body.title !== news.title) {
      news.slug = await generateUniqueSlug(req.body.title, id);
    }

    if (req.body.tags !== undefined) {
      news.tags = typeof req.body.tags === "string" ? JSON.parse(req.body.tags) : req.body.tags;
    }

    if (req.files && req.files.length) {
      const newImages = [];
      for (const f of req.files) {
        const uploaded = await uploadFileToCloudinary(f.path, "news");
        newImages.push({ url: uploaded.url, public_id: uploaded.public_id });
      }

      let removedPublicIds = [];
      if (req.body.removedPublicIds) {
        try {
          removedPublicIds = JSON.parse(req.body.removedPublicIds);
        } catch {
          removedPublicIds = [];
        }
      }

      const keptImages = (news.images || []).filter(
        (img) => !removedPublicIds.includes(img.public_id)
      );

      for (const publicId of removedPublicIds) {
        try {
          await destroyPublicId(publicId);
        } catch (err) {
          console.warn("Failed to delete Cloudinary image:", publicId, err.message);
        }
      }

      news.images = [...keptImages, ...newImages];
    } else if (req.body.removedPublicIds) {
      let removedPublicIds = [];
      try {
        removedPublicIds = JSON.parse(req.body.removedPublicIds);
      } catch {
        removedPublicIds = [];
      }

      news.images = (news.images || []).filter(
        (img) => !removedPublicIds.includes(img.public_id)
      );

      for (const publicId of removedPublicIds) {
        try {
          await destroyPublicId(publicId);
        } catch (err) {
          console.warn("Failed to delete Cloudinary image:", publicId, err.message);
        }
      }
    }

    await news.save();
    res.json(formatNews(news));
  } catch (err) {
    console.error("updateNews error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

const deleteNews = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const news = await News.findById(id);
    if (!news) return res.status(404).json({ message: "Not found" });

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

const incrementView = asyncHandler(async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true, select: "views" }
    );
    if (!news) return res.status(404).json({ message: "Not found" });
    res.json({ views: news.views });
  } catch (err) {
    console.error("incrementView error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

const bulkUpdateStatus = asyncHandler(async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !ids.length || !status) {
      return res.status(400).json({ message: "ids array and status are required" });
    }
    const result = await News.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );
    res.json({ modified: result.modifiedCount });
  } catch (err) {
    console.error("bulkUpdateStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

const bulkDelete = asyncHandler(async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ message: "ids array is required" });
    }

    const newsItems = await News.find({ _id: { $in: ids } });
    for (const item of newsItems) {
      if (item.images && item.images.length) {
        for (const img of item.images) {
          if (img.public_id) {
            try { await destroyPublicId(img.public_id); } catch {}
          }
        }
      }
    }

    await News.deleteMany({ _id: { $in: ids } });
    res.json({ deleted: newsItems.length });
  } catch (err) {
    console.error("bulkDelete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  incrementView,
  bulkUpdateStatus,
  bulkDelete,
};
