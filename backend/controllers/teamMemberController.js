const TeamMember = require('../models/teamMember');
const fs = require('fs');
const path = require('path');

// Get all team members
const getAllTeam = async (req, res) => {
  try {
    const members = await TeamMember.find();
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch team members' });
  }
};

// Create team member
const createTeamMember = async (req, res) => {
  try {
    const { name, position } = req.body;

    // ✅ Save avatar into teamMembers folder
    const avatar = req.file ? `/uploads/teamMembers/${req.file.filename}` : null;

    const member = new TeamMember({ name, position, avatar });
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

    const updatedFields = { name, position };

    if (req.file) {
      updatedFields.avatar = `/uploads/teamMembers/${req.file.filename}`;
    }

    const updated = await TeamMember.findByIdAndUpdate(id, updatedFields, { new: true });

    if (!updated) return res.status(404).json({ message: 'Team member not found' });

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

    // ✅ Delete avatar file if exists
    if (member.avatar) {
      const avatarPath = path.join(__dirname, '..', member.avatar);

      fs.unlink(avatarPath, (err) => {
        if (err) {
          console.warn('Failed to delete avatar:', err.message);
        }
      });
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
