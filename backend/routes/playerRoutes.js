// /backend/routes/playerRoutes.js
const express = require('express');
const mongoose = require("mongoose");

const router = express.Router();
const playerController = require('../controllers/playerController');
const { protect, requireAdminOrSuperAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Team = require('../models/teamModel');
const Player = require('../models/Player');


// ✅ Public: get all verified players with career stats
router.get("/public", async (req, res) => {
  try {
    const players = await Player.find({ verified: true })
      .populate("userId", "name email profileImage playerCode role position battingStyle bowlingStyle dateOfBirth phone bio")
      .lean();

    const result = players
      .filter((p) => p.userId)
      .map((p) => ({
        id: p._id,
        playerCode: p.userId.playerCode || "N/A",
        name: p.userId.name || "Unknown",
        email: p.userId.email || "",
        phone: p.userId.phone || "",
        bio: p.userId.bio || "",
        position: p.position || p.userId.position || "Unknown",
        battingStyle: p.battingStyle || p.userId.battingStyle || "N/A",
        bowlingStyle: p.bowlingStyle || p.userId.bowlingStyle || "N/A",
        dateOfBirth: p.userId.dateOfBirth || null,
        profilePicture: p.userId.profileImage || null,
        submittedAt: p.submittedAt,
        careerStats: p.careerStats || {},
      }));

    res.json({ players: result });
  } catch (err) {
    console.error("❌ Failed to fetch public players:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/check-code", async (req, res) => {
  try {
    // Support both body + query param
    const code = req.body?.code || req.query?.code;
    const seasonNumber = req.body?.seasonNumber || req.query?.seasonNumber;

    console.log("📩 Incoming body:", req.body || {});
    console.log("📩 Incoming query:", req.query || {});
    console.log("📌 seasonNumber received:", seasonNumber);

    if (!code) {
      return res.status(400).json({ message: "❌ Player code is required" });
    }

    const cleanCode = String(code).trim();
    console.log("🔍 Looking for playerCode:", cleanCode);

    const user = await User.findOne({ playerCode: cleanCode });
    console.log("👤 User found:", user ? user._id : "❌ No user");

    if (!user) {
      return res.json({
        exists: false,
        message: "⚠️ No player found with this code",
      });
    }

    let team = null;
    if (seasonNumber && mongoose.Types.ObjectId.isValid(seasonNumber)) {
      team = await Team.findOne({
        seasonNumber: new mongoose.Types.ObjectId(seasonNumber),
        "players.user": user._id,
      });
      console.log("🏏 Team found:", team ? team.teamName : "❌ No team");
    }

    if (team) {
      return res.json({
        exists: true,
        alreadyInTeam: true,
        teamName: team.teamName,
      });
    }

    return res.json({
      exists: true,
      alreadyInTeam: false,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error("🔥 Error checking player:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;





router.use(protect);
router.use(requireAdminOrSuperAdmin );

router.get('/profile', playerController.getPlayerProfile);
router.put('/profile', playerController.updatePlayerProfile);


// router.put('/verify/:playerId', playerController.verifyPlayer);
// router.patch('/reject/:playerId', playerController.rejectPlayer); // ✅ Add this

module.exports = router;
