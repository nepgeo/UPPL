const TeamMember = require('../models/teamMember');
const cloudinary = require('../config/cloudinary'); // ✅ shared Cloudinary config

// ===============================
// Get all team members
// ===============================
const getAllTeam = async (req, res) => {
  try {
    const members = await TeamMember.find();
    res.json(members);
  } catch (err) {
    console.error("❌ Get all team error:", err.message);
    res.status(500).json({ message: 'Failed to fetch team members' });
  }
};

// ===============================
// Create team member
// ===============================
const createTeamMember = async (req, res) => {
  try {
    const { name, position } = req.body;

    let avatar = null;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "teamMembers",
      });
      avatar = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    }

    const member = new TeamMember({ name, position, avatar });
    await member.save();

    res.status(201).json(member);
  } catch (err) {
    console.error('❌ Create error:', err.message);
    res.status(500).json({ message: 'Failed to create team member', error: err.message });
  }
};

// ===============================
// Update team member
// ===============================
const updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, position } = req.body;

    const member = await TeamMember.findById(id);
    if (!member) return res.status(404).json({ message: 'Team member not found' });

    // ✅ Update basic fields
    if (name) member.name = name;
    if (position) member.position = position;

    // ✅ Handle avatar replacement
    if (req.file) {
      if (member.avatar?.public_id) {
        await cloudinary.uploader.destroy(member.avatar.public_id);
      }
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "teamMembers",
      });
      member.avatar = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    }

    const updated = await member.save();
    res.json(updated);
  } catch (err) {
    console.error('❌ Update error:', err.message);
    res.status(500).json({ message: 'Failed to update team member', error: err.message });
  }
};

// ===============================
// Delete team member
// ===============================
const deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await TeamMember.findById(id);

    if (!member) return res.status(404).json({ message: 'Team member not found' });

    // ✅ Delete avatar from Cloudinary if exists
    if (member.avatar?.public_id) {
      await cloudinary.uploader.destroy(member.avatar.public_id);
    }

    await member.deleteOne();
    res.json({ message: '✅ Team member deleted successfully' });
  } catch (err) {
    console.error('❌ Delete error:', err.message);
    res.status(500).json({ message: 'Failed to delete team member', error: err.message });
  }
};

// ===============================
// Exports
// ===============================
module.exports = {
  getAllTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
};
