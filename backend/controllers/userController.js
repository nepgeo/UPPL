const Prediction = require('../models/Prediction');
const Vote = require('../models/Vote');
const Team = require('../models/teamModel');
const Match = require('../models/matchModel');
const User = require('../models/User');
const nodemailer = require("nodemailer");
const mailer = require('../config/mailer'); // ✅ use shared transporter
const bcrypt = require("bcryptjs");

// Update user controller
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params; // user ID to update
    const { name, email, role, verified, playerCode } = req.body;

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update basic fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (verified !== undefined) user.verified = verified;
    if (playerCode) user.playerCode = playerCode;

    // Update profile image (if uploaded)
    if (req.file) {
      user.profileImage = `/uploads/profile/${req.file.filename}`;
    }

    // Update documents (if uploaded)
    if (req.files && req.files.length > 0) {
      user.documents = req.files.map(file => `/uploads/documents/${file.filename}`);
    }

    await user.save();

    // Normalize paths in response
    const profileImage = user.profileImage
      ? user.profileImage.startsWith("/uploads")
        ? user.profileImage
        : `/uploads/profile/${user.profileImage}`
      : null;

    const documents = (user.documents || []).map(doc =>
      doc.startsWith("/uploads") ? doc : `/uploads/documents/${doc}`
    );

    res.json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        profileImage,
        documents,
        playerCode: user.playerCode || null,
      },
    });
  } catch (err) {
    console.error("Update user error:", err.message);
    res.status(500).json({ message: "Error updating user", error: err.message });
  }
};



// exports.updateUser = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       name,
//       email,
//       password,
//       role,
//       phone,
//       position,
//       battingStyle,
//       bowlingStyle,
//       bio,
//       dateOfBirth,
//     } = req.body;

//     const user = await User.findById(id);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // ❌ Prevent assigning 'admin' unless you're a super-admin
//     if (role === 'admin' && req.user.role !== 'super-admin') {
//       return res.status(403).json({ message: 'Only super-admin can assign admin role' });
//     }

//     // ✅ Update basic fields
//     if (name) user.name = name;
//     if (email) user.email = email;
//     if (password) user.password = password; // Will be hashed in pre-save
//     if (role) user.role = role;
//     if (phone) user.phone = phone;
//     if (position) user.position = position;
//     if (battingStyle) user.battingStyle = battingStyle;
//     if (bowlingStyle) user.bowlingStyle = bowlingStyle;
//     if (bio) user.bio = bio;
//     if (dateOfBirth) user.dateOfBirth = dateOfBirth;

//     // ✅ Handle uploaded files
//     // Profile Image
//     if (req.file) {
//       // If using upload.single("profileImage")
//       user.profileImage = `/uploads/profile/${req.file.filename}`;
//     } else if (req.files?.profileImage?.[0]) {
//       // If using upload.fields({ profileImage: ... })
//       user.profileImage = `/uploads/profile/${req.files.profileImage[0].filename}`;
//     }

//     // Documents
//     if (req.files?.documents?.length > 0) {
//       user.documents = req.files.documents.map(
//         (doc) => `/uploads/documents/${doc.filename}`
//       );
//     }


//     const updatedUser = await user.save();

//     // ✅ Return user with correct URLs for frontend
//     res.status(200).json({
//       message: 'User updated successfully',
//       user: {
//         ...updatedUser.toObject(),
//         profileImage: updatedUser.profileImage || '',
//         documents: updatedUser.documents?.map(doc => `/uploads/${doc}`) || [],
//       },
//     });
//   } catch (err) {
//     console.error('Update user error:', err);
//     res.status(500).json({ message: 'Failed to update user' });
//   }
// };

exports.castPrediction = async (req, res) => {
  const { matchId, predictedWinnerId } = req.body;
  const userId = req.user.id;

  // 🚫 Disallow admin or super-admin from predicting
  if (['admin', 'super-admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admins are not allowed to make predictions' });
  }

  try {
    const existingPrediction = await Prediction.findOne({ userId, matchId });
    if (existingPrediction) {
      return res.status(400).json({ message: 'You have already predicted this match' });
    }

    const newPrediction = new Prediction({ userId, matchId, predictedWinnerId });
    await newPrediction.save();

    res.json({ message: 'Prediction submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error submitting prediction', error: err.message });
  }
};

exports.castVote = async (req, res) => {
  const { matchId, playerId } = req.body;
  const userId = req.user.id;

  // 🚫 Disallow admin or super-admin from voting
  if (['admin', 'super-admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admins are not allowed to vote' });
  }

  try {
    const existingVote = await Vote.findOne({ userId, matchId });
    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted for this match' });
    }

    const newVote = new Vote({ userId, matchId, playerId });
    await newVote.save();

    res.json({ message: 'Vote cast successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error casting vote', error: err.message });
  }
};


exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare old password using bcrypt
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash new password before saving
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
