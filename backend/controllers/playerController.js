// /backend/controllers/playerController.js
const Player = require("../models/Player");
const User = require("../models/User");

// ===============================
// Get My Profile (for logged-in player)
// ===============================
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email phone bio dateOfBirth position battingStyle bowlingStyle profileImage documents playerCode role verified team"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    const player = await Player.findOne({ userId: req.user.id }).lean();

    const careerStats = player?.careerStats || {
      matches: 0, innings: 0, runs: 0, ballsFaced: 0, fours: 0, sixes: 0,
      highestScore: 0, notOuts: 0, wickets: 0, ballsBowled: 0, runsConceded: 0,
      bestBowlingWickets: 0, bestBowlingRuns: 0, economy: 0, strikeRate: 0,
      average: 0, catches: 0, stumpings: 0,
    };

    const Team = require("../models/teamModel");
    let team = null;
    try {
      team = await Team.findOne({ "players.user": user._id }).select("teamName logo").lean();
    } catch (_) {}

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        bio: user.bio || "",
        dateOfBirth: user.dateOfBirth || "",
        position: user.position || "",
        battingStyle: user.battingStyle || "",
        bowlingStyle: user.bowlingStyle || "",
        profileImage: user.profileImage || null,
        documents: user.documents || [],
        playerCode: user.playerCode || null,
        role: user.role,
        verified: user.verified,
        team: user.team || null,
      },
      team,
      careerStats,
    });
  } catch (err) {
    console.error("❌ getMyProfile error:", err);
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
};

// ===============================
// Get Player Profile (admin)
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
