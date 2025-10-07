const mongoose = require("mongoose");
const Album = require("../models/Album");
const GalleryImage = require("../models/galleryImage");
const { uploadFileToCloudinary, destroyPublicId } = require("../utils/cloudinaryService");

// ========== ALBUM HANDLERS ==========

// Create album
exports.createAlbum = async (req, res) => {
  try {
    const album = new Album(req.body);
    await album.save();
    res.status(201).json(album);
  } catch (err) {
    console.error("❌ Create album failed:", err);
    res.status(500).json({ message: "Failed to create album" });
  }
};

// Get albums
exports.getAlbums = async (req, res) => {
  try {
    const albums = await Album.find();
    res.json(albums);
  } catch (err) {
    console.error("❌ Get albums failed:", err);
    res.status(500).json({ message: "Failed to fetch albums" });
  }
};

// Update album
exports.updateAlbum = async (req, res) => {
  try {
    const updated = await Album.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    console.error("❌ Update album failed:", err);
    res.status(500).json({ message: "Failed to update album" });
  }
};

// Delete album (and all images inside)
exports.deleteAlbum = async (req, res) => {
  try {
    const images = await GalleryImage.find({ album: req.params.id });

    // ✅ Delete images from Cloudinary
    for (const image of images) {
      if (image.public_id) {
        await destroyPublicId(image.public_id);
      }
    }

    await GalleryImage.deleteMany({ album: req.params.id });
    await Album.findByIdAndDelete(req.params.id);

    res.json({ message: "🗑️ Album and its images deleted." });
  } catch (err) {
    console.error("❌ Delete album failed:", err);
    res.status(500).json({ message: "Failed to delete album" });
  }
};

// ========== IMAGE HANDLERS ==========

exports.uploadImages = async (req, res) => {
  try {
    const { title, albumId, tags } = req.body;

    if (!albumId || !mongoose.Types.ObjectId.isValid(albumId)) {
      return res.status(400).json({ message: "Invalid album ID" });
    }

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const tagArray = tags ? tags.split(",").map((t) => t.trim()) : [];
    const savedImages = [];

    console.log("Received files:", files);

    for (const file of files) {
      console.log("Uploading file to Cloudinary:", file.originalname);

      let uploaded;
      try {
        uploaded = await uploadFileToCloudinary(file.path, "gallery");
        console.log("Cloudinary upload result:", uploaded);
      } catch (err) {
        console.error(`❌ Cloudinary upload failed for file: ${file.originalname}`, err);
        continue; // skip this file
      }

      try {
        const image = new GalleryImage({
          title,
          album: new mongoose.Types.ObjectId(albumId),
          tags: tagArray,
          image: {
            url: uploaded.url,
            public_id: uploaded.public_id,
          },
        });

        await image.save();
        savedImages.push(image);
        console.log(`✅ Saved image to DB: ${file.originalname}`);
      } catch (err) {
        console.error(`❌ Failed to save image to DB for file: ${file.originalname}`, err);
      }
    }

    if (savedImages.length === 0) {
      return res.status(500).json({ message: "Failed to upload any images" });
    }

    res.status(201).json({
      message: `${savedImages.length} image(s) uploaded successfully`,
      images: savedImages,
    });
  } catch (err) {
    console.error("❌ Upload failed:", err);
    res.status(500).json({ message: "Failed to upload images" });
  }
};



// Get images with filters
exports.getImages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      tag,
      season,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const match = {};
    if (tag) match.tags = tag;

    const sortOption = {};
    sortOption[sortBy] = order === "asc" ? 1 : -1;

    const images = await GalleryImage.find(match)
      .populate({
        path: "album",
        match: season ? { isPublic: true, season } : { isPublic: true },
      })
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const filtered = images.filter((img) => img.album !== null);
    res.json(filtered);
  } catch (err) {
    console.error("❌ Fetch images error:", err);
    res.status(500).json({ message: "Failed to fetch images" });
  }
};

// Update image metadata
exports.updateImage = async (req, res) => {
  try {
    const updated = await GalleryImage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error("❌ Update image failed:", err);
    res.status(500).json({ message: "Failed to update image" });
  }
};

// Delete single image
exports.deleteImage = async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // ✅ Delete from Cloudinary
    if (image.public_id) {
      await destroyPublicId(image.public_id);
    }

    await GalleryImage.findByIdAndDelete(req.params.id);
    res.json({ message: "🗑️ Image deleted." });
  } catch (error) {
    console.error("❌ Error deleting image:", error);
    res.status(500).json({ message: "Failed to delete image" });
  }
};

// ========== EXPORT HANDLER ==========

// Instead of downloading from local path, return Cloudinary URL
exports.downloadImage = async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // ✅ Cloudinary file — just return the URL
    res.json({ url: image.url });
  } catch (err) {
    console.error("❌ Download image failed:", err);
    res.status(500).json({ message: "Failed to download image" });
  }
};
