// /backend/controllers/playerController.js
const Player = require('../models/Player');
const User = require('../models/User');


exports.getPlayerProfile = async (req, res) => {
  try {
    const player = await Player.findOne({ userId: req.user.id }).populate('teamId');
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err });
  }
};


exports.updatePlayerProfile = async (req, res) => {
  const updateData = req.body;

  try {
    const updatedPlayer = await Player.findByIdAndUpdate(req.user.id, updateData, { new: true });
    res.json({ message: 'Profile updated', player: updatedPlayer });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err });
  }
};



// ...

exports.verifyPlayer = async (req, res) => {
  const { playerId } = req.params;

  try {
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    player.verified = true;
    await player.save();

    // Update user's role
    await User.findByIdAndUpdate(player.userId, { role: 'player' });

    // ✅ Send back updated player object
    res.json({
      message: 'Player verified successfully',
      player,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error verifying player', error: err.message });
  }
};


// ✅ Controller for rejecting a player
exports.rejectPlayer = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id).populate("userId", "email name");
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    // Downgrade user role to "user"
    await User.findByIdAndUpdate(player.userId._id, { role: "user" });

    // Delete the player document
    await Player.findByIdAndDelete(req.params.id);

    // Send email if needed (optional)
    const transporter = require('nodemailer').createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: player.userId.email,
      subject: "Your Player Verification Request Was Rejected",
      text: `Hi ${player.userId.name},\n\nWe regret to inform you that your player verification request has been rejected.\n\nYou can still access the platform as a regular user.\n\nThank you.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Player rejected and removed, email sent' });
  } catch (err) {
    console.error('Reject player error:', err);
    res.status(500).json({ message: 'Error rejecting player' });
  }
};





