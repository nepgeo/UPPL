const TeamMember = require('../models/teamMember');
const cloudinary = require('../config/cloudinary'); // ✅ use shared Cloudinary config

// Get all team members
const getAllTeam = async (req, res) => {
  try {
    const members = await TeamMember.find();
    res.json(members);
  } catch (err) {
    console.error("Get all team error:", err.message);
    res.status(500).json({ message: 'Failed to fetch team members' });
  }
};

// Create team member
const createTeamMember = async (req, res) => {
  try {
    const { name, position } = req.body;

    let avatar = null;
    let avatarPublicId = null;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "teamMembers",
      });
      avatar = uploadResult.secure_url;
      avatarPublicId = uploadResult.public_id;
    }

    const member = new TeamMember({ name, position, avatar, avatarPublicId });
    await member.save();

    res.status(201).json(member);
  } catch (err) {
    console.error('Create error:', err.message);
    res.status(500).json({ message: 'Failed to create team member' });
  }
};

// Update team member
const updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, position } = req.body;

    const member = await TeamMember.findById(id);
    if (!member) return res.status(404).json({ message: 'Team member not found' });

    // Update fields
    if (name) member.name = name;
    if (position) member.position = position;

    if (req.file) {
      // ✅ Delete old avatar from Cloudinary if exists
      if (member.avatarPublicId) {
        await cloudinary.uploader.destroy(member.avatarPublicId);
      }

      // ✅ Upload new avatar
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "teamMembers",
      });
      member.avatar = uploadResult.secure_url;
      member.avatarPublicId = uploadResult.public_id;
    }

    const updated = await member.save();
    res.json(updated);
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ message: 'Failed to update team member' });
  }
};

// Delete team member
const deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await TeamMember.findById(id);

    if (!member) return res.status(404).json({ message: 'Team member not found' });

    // ✅ Delete avatar from Cloudinary if exists
    if (member.avatarPublicId) {
      await cloudinary.uploader.destroy(member.avatarPublicId);
    }

    await member.deleteOne();
    res.json({ message: 'Team member deleted' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ message: 'Failed to delete team member' });
  }
};

module.exports = {
  getAllTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
};
