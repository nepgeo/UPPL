// backend/scripts/migrateUploadsToCloudinary.js
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

// Models (adjust require paths if your filenames differ)
const News = require('../models/newsModel');
const User = require('../models/userModel');
const Gallery = require('../models/galleryModel');
const Sponsor = require('../models/sponsorModel');
// add other models as needed

const uploadFile = (filePath, folder) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, { folder }, (err, res) => {
      if (err) return reject(err);
      try { fs.unlinkSync(filePath); } catch (e) { console.warn('unlink failed', filePath); }
      resolve(res);
    });
  });

const migrateNews = async () => {
  const items = await News.find({ images: { $exists: true, $ne: [] } });
  for (const it of items) {
    const newImages = [];
    for (const img of it.images) {
      if (typeof img === 'string' && img.startsWith('http')) {
        newImages.push(img);
        continue;
      }
      const rel = String(img).replace(/^\/?uploads\//, '');
      const abs = path.join(__dirname, '..', 'uploads', rel);
      if (fs.existsSync(abs)) {
        const uploaded = await uploadFile(abs, 'uppl/news');
        newImages.push(uploaded.secure_url);
      } else {
        console.warn('file not found', abs);
      }
    }
    it.images = newImages;
    await it.save();
    console.log('Migrated news', it._id);
  }
};

const migrateUsers = async () => {
  const items = await User.find({
    $or: [{ profileImage: { $regex: '^/uploads' } }, { documents: { $exists: true, $ne: [] } }]
  });
  for (const u of items) {
    if (u.profileImage && typeof u.profileImage === 'string' && u.profileImage.startsWith('/uploads')) {
      const rel = u.profileImage.replace(/^\/?uploads\//, '');
      const abs = path.join(__dirname, '..', 'uploads', rel);
      if (fs.existsSync(abs)) {
        const uploaded = await uploadFile(abs, 'uppl/profile');
        u.profileImage = uploaded.secure_url;
      }
    }
    if (Array.isArray(u.documents) && u.documents.length > 0) {
      const newDocs = [];
      for (const doc of u.documents) {
        if (typeof doc === 'string' && doc.startsWith('/uploads')) {
          const rel = doc.replace(/^\/?uploads\//, '');
          const abs = path.join(__dirname, '..', 'uploads', rel);
          if (fs.existsSync(abs)) {
            const uploaded = await uploadFile(abs, 'uppl/documents');
            newDocs.push(uploaded.secure_url);
          }
        } else {
          newDocs.push(doc);
        }
      }
      u.documents = newDocs;
    }
    await u.save();
    console.log('Migrated user', u._id);
  }
};

const migrateGallery = async () => {
  const items = await Gallery.find({ images: { $exists: true, $ne: [] } });
  for (const it of items) {
    const newImages = [];
    for (const img of it.images) {
      if (typeof img === 'string' && img.startsWith('http')) {
        newImages.push(img);
        continue;
      }
      const rel = String(img).replace(/^\/?uploads\//, '');
      const abs = path.join(__dirname, '..', 'uploads', rel);
      if (fs.existsSync(abs)) {
        const uploaded = await uploadFile(abs, 'uppl/gallery');
        newImages.push(uploaded.secure_url);
      } else {
        console.warn('file not found', abs);
      }
    }
    it.images = newImages;
    await it.save();
    console.log('Migrated gallery', it._id);
  }
};

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await migrateNews();
  await migrateUsers();
  await migrateGallery();
  console.log('Migration completed');
  process.exit(0);
};

main().catch(err => { console.error(err); process.exit(1); });
