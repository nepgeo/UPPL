// /backend/controllers/playerController.js
const Player = require("../models/Player");
const User = require("../models/User");

// ===============================
// Get Player Profile
// ===============================
exports.getPlayerProfile = async (req, res) => {
  try {
    const player = await Player.findOne({ userId: req.user.id })
      .populate("teamId")
      .populate("userId", "name email profileImage documents playerCode role verified");

    if (!player) return res.status(404).json({ message: "Player not found" });

    res.json(player);
  } catch (err) {
    console.error("❌ getPlayerProfile error:", err);
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
};

// ===============================
// Update Player Profile
// ===============================
exports.updatePlayerProfile = async (req, res) => {
  try {
    const updateData = req.body;

    // ✅ Fix: Player is looked up by userId, not playerId
    const updatedPlayer = await Player.findOneAndUpdate(
      { userId: req.user.id },
      updateData,
      { new: true }
    )
      .populate("teamId")
      .populate("userId", "name email profileImage documents playerCode role verified");

    if (!updatedPlayer) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json({ message: "✅ Profile updated", player: updatedPlayer });
  } catch (err) {
    console.error("❌ updatePlayerProfile error:", err);
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
};

// ===============================
// Verify Player
// ===============================
exports.verifyPlayer = async (req, res) => {
  const { playerId } = req.params;

  try {
    const player = await Player.findById(playerId).populate("userId");
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    player.verified = true;
    await player.save();

    // ✅ Update linked user
    await User.findByIdAndUpdate(player.userId, { verified: true, role: "player" });

    res.json({
      message: "✅ Player verified successfully",
      player,
    });
  } catch (err) {
    console.error("❌ verifyPlayer error:", err);
    res.status(500).json({ message: "Error verifying player", error: err.message });
  }
};

// ===============================
// Reject Player
// ===============================
exports.rejectPlayer = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id).populate("userId", "email name");
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    // Downgrade user role + unverify
    await User.findByIdAndUpdate(player.userId._id, { role: "user", verified: false });

    // Delete the Player entry
    await Player.findByIdAndDelete(req.params.id);

    // Send rejection email
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: player.userId.email,
      subject: "❌ Your Player Verification Request Was Rejected",
      text: `Hi ${player.userId.name},\n\nWe regret to inform you that your player verification request has been rejected.\n\nYou can still use the platform as a regular user.\n\nThank you.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "❌ Player rejected, downgraded to user, email sent" });
  } catch (err) {
    console.error("❌ rejectPlayer error:", err);
    res.status(500).json({ message: "Error rejecting player", error: err.message });
  }
};
