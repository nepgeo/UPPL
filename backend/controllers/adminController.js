const Team = require('../models/teamModel');
const Match = require('../models/matchModel');
const User = require('../models/User');
const Player = require('../models/Player');
const News = require('../models/newsModel');
const { OrganizationSponsor, IndividualSponsor } = require('../models/sponsorModel');
const GalleryImage = require('../models/galleryImage');
const Video = require('../models/Video');
const mailer = require('../config/mailer'); 
const generatePlayerCode = require('../utils/generatePlayerCode');
const { uploadFileToCloudinary, destroyPublicId } = require("../utils/cloudinaryService");

// ✅ Add Player
exports.addPlayer = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      position,
      battingStyle,
      bowlingStyle,
      bio,
      dateOfBirth,
    } = req.body;

    const newUser = new User({
      name,
      email,
      password,
      phone,
      position,
      battingStyle,
      bowlingStyle,
      bio,
      dateOfBirth,
      role: "player",
    });

    // ✅ Cloudinary profileImage
    if (req.files?.profileImage?.[0]) {
      const uploaded = await uploadFileToCloudinary(
        req.files.profileImage[0].path,
        "users/profile"
      );
      newUser.profileImage = uploaded;
    }

    // ✅ Cloudinary documents
    if (req.files?.documents?.length > 0) {
      const docs = [];
      for (const file of req.files.documents) {
        const uploaded = await uploadFileToCloudinary(file.path, "users/documents");
        docs.push(uploaded);
      }
      newUser.documents = docs;
    }

    await newUser.save();

    await Player.create({
      userId: newUser._id,
      position: position || '',
      battingStyle: battingStyle || '',
      bowlingStyle: bowlingStyle || '',
      verified: true,
    });

    res.status(201).json({
      message: "Player added successfully",
      player: newUser,
    });
  } catch (err) {
    console.error("❌ Error adding player:", err);
    res.status(500).json({ message: "Error adding player", error: err.message });
  }
};

// ✅ Add Team
exports.addTeam = async (req, res) => {
  try {
    const newTeam = new Team(req.body);
    await newTeam.save();
    res.status(201).json({ message: 'Team added successfully', team: newTeam });
  } catch (err) {
    res.status(500).json({ message: 'Error adding team', error: err });
  }
};

// ✅ Add Match
exports.addMatch = async (req, res) => {
  try {
    const newMatch = new Match(req.body);
    await newMatch.save();
    res.status(201).json({ message: 'Match added successfully', match: newMatch });
  } catch (err) {
    res.status(500).json({ message: 'Error adding match', error: err });
  }
};

// ✅ Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, role } = req.query;

    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 });
    const totalUsers = await User.countDocuments(filter);

    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
      verified: user.verified || false,
      bio: user.bio || "N/A",
      phone: user.phone || "N/A",
      playerCode: user.playerCode || null,
      position: user.position || "Unknown",
      battingStyle: user.battingStyle || "N/A",
      bowlingStyle: user.bowlingStyle || "N/A",
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split("T")[0]
        : null,
      profileImage: user.profileImage?.url || null,
      documents: user.documents || [],
      joinDate: user.createdAt
        ? new Date(user.createdAt).toISOString().split("T")[0]
        : "N/A",
    }));

    // Unfiltered counts for stats cards
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalPlayers = await User.countDocuments({ role: 'player' });
    const pendingPlayers = await User.countDocuments({ role: 'player', $or: [{ verified: false }, { verified: { $exists: false } }] });

    res.status(200).json({ users: formattedUsers, totalUsers, totalAdmins, totalPlayers, pendingPlayers });
  } catch (err) {
    console.error("❌ Error in getAllUsers:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// ✅ Dashboard stats
exports.getAdminDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedPlayers = await User.countDocuments({ role: 'player', verified: true });
    const pendingPlayers = await User.countDocuments({
      role: 'player',
      $or: [{ verified: false }, { verified: { $exists: false } }]
    });

    const pendingPlayersRaw = await User.find({
      role: 'player',
      $or: [{ verified: false }, { verified: { $exists: false } }]
    });

    const totalTeams = await Team.countDocuments();
    const totalMatches = await Match.countDocuments();
    const completedMatches = await Match.countDocuments({ result: 'completed' });
    const upcomingMatches = await Match.countDocuments({ result: 'upcoming' });
    const activeMatches = await Match.countDocuments({ result: 'live' }) || 0;

    // Content stats
    const totalNews = await News.countDocuments();
    const draftNews = await News.countDocuments({ status: 'draft' });
    const publishedNews = await News.countDocuments({ status: 'published' });
    const totalGalleryImages = await GalleryImage.countDocuments();
    const totalSponsors = await OrganizationSponsor.countDocuments() + await IndividualSponsor.countDocuments();
    const totalVideos = await Video.countDocuments();

    // Player role distribution
    const batsmen = await User.countDocuments({ role: 'player', position: 'batsman' });
    const bowlers = await User.countDocuments({ role: 'player', position: 'bowler' });
    const allRounders = await User.countDocuments({ role: 'player', position: 'all-rounder' });
    const wicketKeepers = await User.countDocuments({ role: 'player', position: { $in: ['wicketkeeper', 'wicket-keeper', 'wk'] } });

    // Recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select('name email role profileImage createdAt')
      .lean();

    const recentMatches = await Match.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('teamA', 'teamName')
      .populate('teamB', 'teamName')
      .select('teamA teamB result matchTime updatedAt')
      .lean();

    // Build activity feed from real data
    const recentRegistrations = await User.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name createdAt')
      .lean();

    const recentMatchUpdates = await Match.find({ result: { $ne: 'upcoming' } })
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate('teamA', 'teamName')
      .populate('teamB', 'teamName')
      .select('teamA teamB result updatedAt')
      .lean();

    const recentVerifications = await User.find({ role: 'player', verified: true })
      .sort({ updatedAt: -1 })
      .limit(3)
      .select('name updatedAt')
      .lean();

    const activityFeed = [];

    recentMatchUpdates.forEach(m => {
      activityFeed.push({
        action: m.result === 'completed' ? 'Match Completed' : 'Match went Live',
        details: `${m.teamA?.teamName || 'Team A'} vs ${m.teamB?.teamName || 'Team B'}`,
        time: m.updatedAt,
        type: m.result === 'completed' ? 'success' : 'info',
      });
    });

    recentRegistrations.forEach(u => {
      activityFeed.push({
        action: 'New Registration',
        details: u.name || 'Unknown user',
        time: u.createdAt,
        type: 'user',
      });
    });

    recentVerifications.forEach(u => {
      activityFeed.push({
        action: 'Player Verified',
        details: u.name || 'Unknown player',
        time: u.updatedAt,
        type: 'verification',
      });
    });

    activityFeed.sort((a, b) => new Date(b.time) - new Date(a.time));
    activityFeed.splice(8);

    const pendingPlayersList = pendingPlayersRaw.map(player => ({
      id: player._id,
      name: player.name || 'Unknown',
      email: player.email || 'No email',
      phone: player.phone || 'N/A',
      role: player.role || 'player',
      bio: player.bio || 'N/A',
      position: player.position || 'Unknown',
      battingStyle: player.battingStyle || 'N/A',
      bowlingStyle: player.bowlingStyle || 'N/A',
      submittedAt: player.createdAt?.toISOString() || 'N/A',
      profileImage: player.profileImage?.url || '',
      documents: player.documents || [],
    }));

    res.set('Cache-Control', 'no-store');
    res.json({
      totalUsers,
      verifiedPlayers,
      pendingPlayers,
      activeMatches,
      totalTeams,
      totalMatches,
      completedMatches,
      upcomingMatches,
      contentStats: {
        totalNews,
        draftNews,
        publishedNews,
        totalGalleryImages,
        totalSponsors,
        totalVideos,
      },
      playerRoles: {
        batsmen,
        bowlers,
        allRounders,
        wicketKeepers,
      },
      recentUsers,
      recentMatches,
      activityFeed,
      pendingPlayersList
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// ✅ Create user
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'user',
      phone,
      position,
      battingStyle,
      bowlingStyle,
      bio,
      dateOfBirth,
    } = req.body;

    if (role === 'admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({ message: "Only super-admin can create admin users" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const newUser = new User({
      name,
      email,
      password,
      role,
      phone,
      position,
      battingStyle,
      bowlingStyle,
      bio,
      dateOfBirth,
    });

    if (req.files?.profileImage?.[0]) {
      newUser.profileImage = await uploadFileToCloudinary(req.files.profileImage[0].path, "users/profile");
    }

    if (req.files?.documents?.length > 0) {
      const docs = [];
      for (const file of req.files.documents) {
        const uploaded = await uploadFileToCloudinary(file.path, "users/documents");
        docs.push(uploaded);
      }
      newUser.documents = docs;
    }

    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
      },
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Failed to create user", details: err.message });
  }
};

// ✅ Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (updates.role === 'admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Only super-admin can assign admin role' });
    }

    Object.assign(user, updates);

    if (req.files?.profileImage?.[0]) {
      if (user.profileImage?.public_id) {
        await destroyPublicId(user.profileImage.public_id);
      }
      user.profileImage = await uploadFileToCloudinary(req.files.profileImage[0].path, "users/profile");
    }

    if (req.files?.documents?.length > 0) {
      // optionally clear old docs or append
      for (const doc of user.documents) {
        if (doc.public_id) await destroyPublicId(doc.public_id);
      }
      const docs = [];
      for (const file of req.files.documents) {
        const uploaded = await uploadFileToCloudinary(file.path, "users/documents");
        docs.push(uploaded);
      }
      user.documents = docs;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        verified: updatedUser.verified,
        profileImage: updatedUser.profileImage || null,
        documents: updatedUser.documents || [],
        playerCode: updatedUser.playerCode || null,
        team: updatedUser.team || null,
      },
    });
  } catch (err) {
    console.error('Update user error:', err.message || err);
    console.error('Stack:', err.stack);
    console.error('Req body:', JSON.stringify(req.body));
    console.error('Req files keys:', req.files ? Object.keys(req.files) : 'none');
    res.status(500).json({ error: 'Failed to update user', details: err.message || 'Unknown error' });
  }
};

// ✅ Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.profileImage?.public_id) {
      await destroyPublicId(user.profileImage.public_id);
    }
    if (user.documents?.length > 0) {
      for (const doc of user.documents) {
        if (doc.public_id) await destroyPublicId(doc.public_id);
      }
    }

    await user.deleteOne();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// ✅ Verify player
exports.verifyPlayer = async (req, res) => {
  try {
    const { playerId } = req.params;
    const player = await User.findById(playerId);
    if (!player) return res.status(404).json({ message: "User not found" });
    if (player.verified) return res.status(400).json({ message: "Player already verified." });

    player.role = "player";
    player.verified = true;
    player.playerCode = await generatePlayerCode();
    await player.save();

    const existingPlayer = await Player.findOne({ userId: player._id });
    if (!existingPlayer) {
      await Player.create({
        userId: player._id,
        position: player.position || '',
        battingStyle: player.battingStyle || '',
        bowlingStyle: player.bowlingStyle || '',
        verified: true,
      });
    }

    await mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: player.email,
      subject: "Your Player Account Has Been Verified",
      text: `Hi ${player.name}, your account is verified. Your player code is: ${player.playerCode}`,
    });

    res.json({ message: "Player verified, code generated, and email sent", player });
  } catch (err) {
    console.error("Error verifying player:", err);
    res.status(500).json({ message: "Failed to verify player" });
  }
};

// ✅ Reject player
exports.rejectPlayer = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { reason } = req.body;
    const user = await User.findById(playerId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.profileImage?.public_id) {
      await destroyPublicId(user.profileImage.public_id);
    }
    if (user.documents?.length > 0) {
      for (const doc of user.documents) {
        if (doc.public_id) await destroyPublicId(doc.public_id);
      }
    }

    user.rejectionReason = reason || '';
    user.rejectedAt = new Date();
    user.role = 'user';
    user.verified = false;
    user.position = undefined;
    user.battingStyle = undefined;
    user.bowlingStyle = undefined;
    user.documents = [];
    user.profileImage = { url: '', public_id: '' };

    await user.save();

    const emailText = reason
      ? `Hi ${user.name},\n\nUnfortunately your player verification request has been rejected.\n\nReason: ${reason}\n\nYou can sign up again and submit a new request at any time.`
      : `Hi ${user.name}, unfortunately your player verification request has been rejected. You can sign up again and submit a new request at any time.`;

    await mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your Player Verification Request Was Rejected",
      text: emailText,
    });

    res.json({ message: 'Player rejected and email sent' });
  } catch (err) {
    console.error('Error rejecting player:', err);
    res.status(500).json({ message: 'Failed to reject player' });
  }
};

// ✅ Pending players
exports.getPendingPlayers = async (req, res) => {
  try {
    const pendingPlayers = await User.find({
      role: 'player',
      $or: [{ verified: false }, { verified: { $exists: false } }]
    });

    const formatted = pendingPlayers.map(player => ({
      id: player._id,
      name: player.name,
      email: player.email,
      phone: player.phone || 'N/A',
      position: player.position || 'N/A',
      battingStyle: player.battingStyle || 'N/A',
      bowlingStyle: player.bowlingStyle || 'N/A',
      bio: player.bio || 'N/A',
      submittedAt: player.createdAt?.toISOString() || 'N/A',
      profileImage: player.profileImage?.url || '',
      documents: player.documents || [],
    }));

    res.json({ pendingPlayers: formatted });
  } catch (err) {
    console.error('Error fetching pending players:', err);
    res.status(500).json({ error: 'Failed to fetch pending players' });
  }
};
