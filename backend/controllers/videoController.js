const Video = require('../models/Video');

exports.getVideos = async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { active: true };
    const videos = await Video.find(filter).sort({ order: 1, createdAt: -1 });
    return res.json({ success: true, videos });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    return res.json({ success: true, video });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.createVideo = async (req, res) => {
  try {
    const { title, description, url, embedUrl, thumbnail, type, active, order } = req.body;
    const video = await Video.create({
      title,
      description,
      url,
      embedUrl,
      thumbnail,
      type,
      active,
      order,
      createdBy: req.user.id
    });
    return res.status(201).json({ success: true, video });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!video) return res.status(404).json({ message: 'Video not found' });
    return res.json({ success: true, video });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    return res.json({ success: true, message: 'Video deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
