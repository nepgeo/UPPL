const Prediction = require('../models/Prediction');
const Vote = require('../models/Vote');
const Team = require('../models/teamModel');
const Match = require('../models/matchModel');
const User = require('../models/User');
const mailer = require('../config/mailer'); // ✅ shared transporter
const bcrypt = require("bcryptjs");
const { uploadFileToCloudinary, destroyPublicId } = require("../utils/cloudinaryService"); // ✅ Cloudinary utils

// ===============================
// Update User Controller
// ===============================
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params; 
    const { name, email, role, verified, playerCode } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Update basic fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (verified !== undefined) user.verified = verified;
    if (playerCode) user.playerCode = playerCode;

    // ✅ Profile image (multer.fields → req.files.profileImage[0])
    if (req.files?.profileImage?.[0]) {
      if (user.profileImage?.public_id) {
        await destroyPublicId(user.profileImage.public_id);
      }

      const uploaded = await uploadFileToCloudinary(
        req.files.profileImage[0].path,
        "users/profile"
      );

      user.profileImage = uploaded;
    }

    // ✅ Documents (multer.fields → req.files.documents[])
    if (req.files?.documents?.length > 0) {
      // remove old documents
      if (user.documents?.length) {
        for (const doc of user.documents) {
          if (doc.public_id) {
            await destroyPublicId(doc.public_id);
          }
        }
      }

      const uploadedDocs = [];
      for (const file of req.files.documents) {
        const uploaded = await uploadFileToCloudinary(file.path, "users/documents");
        uploadedDocs.push(uploaded);
      }
      user.documents = uploadedDocs;
    }

    await user.save();

    res.json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        profileImage: user.profileImage || null,
        documents: user.documents || [],
        playerCode: user.playerCode || null,
      },
    });
  } catch (err) {
    console.error("❌ Update user error:", err.message);
    res.status(500).json({ message: "Error updating user", error: err.message });
  }
};

// ===============================
// Cast Prediction
// ===============================
exports.castPrediction = async (req, res) => {
  const { matchId, predictedWinnerId } = req.body;
  const userId = req.user.id;

  if (["admin", "super-admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Admins are not allowed to make predictions" });
  }

  try {
    const existingPrediction = await Prediction.findOne({ userId, matchId });
    if (existingPrediction) {
      return res.status(400).json({ message: "You have already predicted this match" });
    }

    const newPrediction = new Prediction({ userId, matchId, predictedWinnerId });
    await newPrediction.save();

    res.json({ message: "Prediction submitted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error submitting prediction", error: err.message });
  }
};

// ===============================
// Cast Vote
// ===============================
exports.castVote = async (req, res) => {
  const { matchId, playerId } = req.body;
  const userId = req.user.id;

  if (["admin", "super-admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Admins are not allowed to vote" });
  }

  try {
    const existingVote = await Vote.findOne({ userId, matchId });
    if (existingVote) {
      return res.status(400).json({ message: "You have already voted for this match" });
    }

    const newVote = new Vote({ userId, matchId, playerId });
    await newVote.save();

    res.json({ message: "Vote cast successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error casting vote", error: err.message });
  }
};

// ===============================
// Change Password
// ===============================
exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Change password error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
