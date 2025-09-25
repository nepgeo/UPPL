const Team = require('../models/teamModel');
const Match = require('../models/matchModel');
const User = require('../models/User');
const nodemailer = require("nodemailer");
const mailer = require('../config/mailer'); // ✅ use shared transporter


const generatePlayerCode = require('../utils/generatePlayerCode');

// ✅ Add Player (just create a User with role "player")
exports.addPlayer = async (req, res) => {
  try {
    // Extract text fields from body
    const {
      name,
      email,
      password,
      phone,
      position,
      battingStyle,
      bowlingStyle,
      bio,          // ✅ explicitly pull bio
      dateOfBirth,
    } = req.body;

    // Build the new user
    const newUser = new User({
      name,
      email,
      password,
      phone,
      position,
      battingStyle,
      bowlingStyle,
      bio,          // ✅ now bio will be saved
      dateOfBirth,
      role: "player",
    });

    // Handle uploaded files
    if (req.files?.profileImage?.[0]) {
      newUser.profileImage = `/uploads/profile/${req.files.profileImage[0].filename}`;
    }

    if (req.files?.documents?.length > 0) {
      newUser.documents = req.files.documents.map(
        (doc) => `/uploads/documents/${doc.filename}`
      );
    }

    await newUser.save();

    res.status(201).json({
      message: "Player added successfully",
      player: newUser,
    });
  } catch (err) {
    console.error("❌ Error adding player:", err);
    res.status(500).json({ message: "Error adding player", error: err.message });
  }
};


exports.addTeam = async (req, res) => {
  const teamData = req.body;
  try {
    const newTeam = new Team(teamData);
    await newTeam.save();
    res.status(201).json({ message: 'Team added successfully', team: newTeam });
  } catch (err) {
    res.status(500).json({ message: 'Error adding team', error: err });
  }
};

exports.addMatch = async (req, res) => {
  const matchData = req.body;
  try {
    const newMatch = new Match(matchData);
    await newMatch.save();
    res.status(201).json({ message: 'Match added successfully', match: newMatch });
  } catch (err) {
    res.status(500).json({ message: 'Error adding match', error: err });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find().skip(skip).limit(limit);
    const totalUsers = await User.countDocuments();

    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
      verified: user.verified || false,
      bio: user.bio || "N/A",
      phone: user.phone || "N/A",
      playerCode: user.playerCode || null,

      // ✅ Added missing fields
      position: user.position || "Unknown",
      battingStyle: user.battingStyle || "N/A",
      bowlingStyle: user.bowlingStyle || "N/A",
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split("T")[0]
        : null,

      profileImage: user.profileImage
        ? `/uploads/${user.profileImage.replace(/\\/g, "/")}`
        : null,

      joinDate: user.createdAt
        ? new Date(user.createdAt).toISOString().split("T")[0]
        : "N/A",
    }));

    res.status(200).json({ users: formattedUsers, totalUsers });
  } catch (err) {
    console.error("❌ Error in getAllUsers:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};



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
      profileImage: player.profileImage ? `/uploads/${player.profileImage}` : '',
      documents: (player.documents || []).map(doc => `/uploads/${doc}`),

    }));

    res.set('Cache-Control', 'no-store');
    res.json({
      totalUsers,
      verifiedPlayers,
      pendingPlayers,
      recentActivity: [
        { action: 'System Init', details: 'Dashboard initialized', time: 'Just now', type: 'info' }
      ],
      pendingPlayersList
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};


// ✅ Create new user
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
      profileImage,
      documents,
    } = req.body;

    // 🔐 Only super-admin can create an admin
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
      profileImage,
      documents,
    });

    await newUser.save(); // 🔒 Password will be hashed in pre-save hook

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
    const {
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
    } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ❌ Prevent assigning 'admin' unless you're a super-admin
    if (role === 'admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Only super-admin can assign admin role' });
    }

    // ✅ Update basic fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password; // Will be hashed in pre-save
    if (role) user.role = role;
    if (phone) user.phone = phone;
    if (position) user.position = position;
    if (battingStyle) user.battingStyle = battingStyle;
    if (bowlingStyle) user.bowlingStyle = bowlingStyle;
    if (bio) user.bio = bio;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;

    // ✅ Handle uploaded files with full /uploads path
    if (req.files?.profileImage?.[0]) {
      user.profileImage = `/uploads/profile/${req.files.profileImage[0].filename}`;
    }

    if (req.files?.documents?.length > 0) {
      user.documents = req.files.documents.map(
        doc => `/uploads/documents/${doc.filename}`
      );
    }

    const updatedUser = await user.save();

    // ✅ Send response with normalized URLs
    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        verified: updatedUser.verified,
        phone: updatedUser.phone || null,
        position: updatedUser.position || null,
        battingStyle: updatedUser.battingStyle || null,
        bowlingStyle: updatedUser.bowlingStyle || null,
        bio: updatedUser.bio || null,
        dateOfBirth: updatedUser.dateOfBirth || null,
        profileImage: updatedUser.profileImage || null,
        documents: updatedUser.documents || [],
        playerCode: updatedUser.playerCode || null,
      },
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};





// ✅ Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};




exports.verifyPlayer = async (req, res) => {
  const { playerId } = req.params;
  console.log("Trying to verify player:", playerId);

  try {
    const player = await User.findById(playerId);

    if (!player) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already verified
    if (player.verified) {
      return res.status(400).json({ message: "Player is already verified." });
    }

    // Assign role and verified status
    player.role = "player";
    player.verified = true;

    // Generate and assign unique 4-digit code
    player.playerCode = await generatePlayerCode();

    await player.save();

    // Send email with player code
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: player.email,
      subject: "Your Player Account Has Been Verified",
      text: `Hi ${player.name},\n\nYour player account has been verified.\nYour 4-digit Player Code is: ${player.playerCode}\n\nUse this code to join a team.\n\nThank you!`,
    };

    try {
      const info = await mailer.sendMail(mailOptions);
      console.log("✅ Verification email sent:", info.messageId || info.response);
    } catch (err) {
      console.error("❌ Email send error (verifyPlayer):", err);
    }

    res.json({
      message: "Player verified, code generated, and email sent",
      player,
    });
  } catch (error) {
    console.error("Error verifying player:", error);
    res.status(500).json({ message: "Failed to verify player" });
  }
};

exports.rejectPlayer = async (req, res) => {
  const { playerId } = req.params;

  try {
    const user = await User.findById(playerId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'user';
    user.verified = false;

    user.position = undefined;
    user.battingStyle = undefined;
    user.bowlingStyle = undefined;
    user.documents = [];

    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your Player Verification Request Was Rejected',
      text: `Hi ${user.name},\n\nWe regret to inform you that your player verification request has been rejected.\n\nYou can still access the platform as a regular user.\n\nThank you.`,
    };

    try {
      const info = await mailer.sendMail(mailOptions);
      console.log("✅ Rejection email sent:", info.messageId || info.response);
    } catch (err) {
      console.error("❌ Email send error (rejectPlayer):", err);
    }

    res.json({
      message: 'Player rejected, role downgraded, and email sent',
    });
  } catch (error) {
    console.error('Error rejecting player:', error);
    res.status(500).json({ message: 'Failed to reject player' });
  }
};


exports.getPendingPlayers = async (req, res) => {
  try {
    const pendingPlayers = await User.find({
      role: 'player',
      $or: [{ verified: false }, { verified: { $exists: false } }]
    });

    const formattedPlayers = pendingPlayers.map(player => ({
      id: player._id,
      name: player.name,
      email: player.email,
      phone: player.phone || 'N/A',
      position: player.position || 'N/A',
      battingStyle: player.battingStyle || 'N/A',
      bowlingStyle: player.bowlingStyle || 'N/A',
      bio: player.bio || 'N/A',
      submittedAt: player.createdAt?.toISOString() || 'N/A',
      profileImage: player.profileImage ? `/uploads/${player.profileImage}` : '',
      documents: (player.documents || []).map(doc => `/uploads/${doc}`),
    }));

    res.json({ pendingPlayers: formattedPlayers });
  } catch (err) {
    console.error('Error fetching pending players:', err);
    res.status(500).json({ error: 'Failed to fetch pending players' });
  }
};
