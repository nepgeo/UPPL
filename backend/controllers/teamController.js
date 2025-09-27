// controllers/teamController.js
const Team = require('../models/teamModel');
const Season = require('../models/seasonModel');
const User = require('../models/User');
const mongoose = require('mongoose');
const { uploadFileToCloudinary, destroyPublicId } = require("../utils/cloudinaryService");

// Utility to generate 4-character team code
function generateTeamCode(teamId) {
  const shortId = teamId.toString().slice(-4);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomChar = alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${randomChar}${shortId.toUpperCase()}`;
}

// ✅ Create Team
const createTeam = async (req, res) => {
  try {
    console.log("📦 req.body:", req.body);
    console.log("📂 req.files:", req.files);
    console.log("👤 req.user:", req.user);

    const { seasonNumber } = req.body;

    if (!mongoose.Types.ObjectId.isValid(seasonNumber)) {
      return res.status(400).json({ message: "❌ Invalid season ID" });
    }

    const season = await Season.findById(seasonNumber);
    if (!season) {
      return res.status(404).json({ message: "❌ Season not found" });
    }

    // ✅ Handle file uploads
    let paymentReceipt = null;
    let teamLogo = null;

    if (req.files?.paymentReceipt?.[0]) {
      paymentReceipt = await uploadFileToCloudinary(
        req.files.paymentReceipt[0].path,
        "teams/paymentReceipts"
      );
    }

    if (req.files?.teamLogo?.[0]) {
      teamLogo = await uploadFileToCloudinary(
        req.files.teamLogo[0].path,
        "teams/logos"
      );
    }

    // ✅ Parse players
    let players = [];
    if (req.body.players) {
      try {
        players = JSON.parse(req.body.players);
      } catch (err) {
        return res.status(400).json({ message: "❌ Invalid players data format" });
      }
    }

    const preparedPlayers = await Promise.all(
      players.map(async (p) => {
        const player = {
          user: null,
          status: "not_registered",
          position: p.role || "",
          jerseyNumber: p.jerseyNumber ? Number(p.jerseyNumber) : null,
          name: p.name || "",
          code: p.playerCode || null,
        };

        if (p.playerCode) {
          const trimmedCode = p.playerCode.toString().trim();
          const matchedUser = await User.findOne({ playerCode: trimmedCode });
          if (matchedUser) {
            player.user = matchedUser._id;
            player.status = matchedUser.verified ? "verified" : "pending";
            player.name = matchedUser.name;
            player.code = matchedUser.playerCode;
          }
        }
        return player;
      })
    );

    // ✅ Create team
    const newTeam = new Team({
      teamName: req.body.teamName,
      captainName: req.body.captainName,
      coachName: req.body.coachName || "",
      managerName: req.body.managerName || "",
      contactNumber: req.body.contactNumber || "",
      seasonNumber: new mongoose.Types.ObjectId(seasonNumber),
      groupName: req.body.groupName || null,
      createdBy: req.user?.id,
      paymentReceipt,
      teamLogo,
      players: preparedPlayers,
      teamCode: "TEMP",
    });

    await newTeam.save();

    // Generate team code
    newTeam.teamCode = generateTeamCode(newTeam._id);
    await newTeam.save();

    // Push into season groups
    let group = season.groups.find((g) => g.groupName === req.body.groupName);
    if (!group) {
      group = { groupName: req.body.groupName || "Ungrouped", teams: [] };
      season.groups.push(group);
    }
    group.teams.push({
      team: newTeam._id,
      teamName: newTeam.teamName,
      teamCode: newTeam.teamCode,
    });
    await season.save();

    res.status(201).json({ message: "✅ Team registered successfully", team: newTeam });
  } catch (err) {
    console.error("❌ Team creation failed:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

// ✅ Get teams by season
const getTeamsBySeason = async (req, res) => {
  try {
    const { seasonId } = req.query;
    if (!mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({ message: 'Invalid season ID' });
    }

    const teams = await Team.find({ seasonNumber: seasonId })
      .populate('seasonNumber', 'seasonNumber entryDeadline isCurrent')
      .populate('createdBy', 'name email role')
      .populate({
        path: 'players.user',
        select: 'name email phone profileImage documents playerCode role position dateOfBirth battingStyle bowlingStyle bio',
      })
      .lean();

    const response = teams.map((team) => ({
      ...team,
      season: {
        number: team.seasonNumber.seasonNumber,
        year: new Date(team.seasonNumber.entryDeadline).getFullYear(),
        isCurrent: team.seasonNumber.isCurrent,
      },
    }));

    res.json(response);
  } catch (error) {
    console.error('❌ Failed to fetch teams:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ✅ Get team by ID
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('seasonNumber', 'number year')
      .populate('createdBy', 'name email role')
      .populate('players.user', 'name email playerCode role profileImage documents position battingStyle bowlingStyle phone verified')
      .lean();

    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json(team);
  } catch (err) {
    console.error('Error fetching team:', err);
    res.status(500).json({ message: 'Failed to fetch team', error: err.message });
  }
};

// ✅ Update team
const updateTeam = async (req, res) => {
  try {
    const teamId = req.params.id;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const { teamName, captainName, coachName, managerName, contactNumber, players } = req.body;

    if (teamName) team.teamName = teamName;
    if (captainName) team.captainName = captainName;
    if (coachName) team.coachName = coachName;
    if (managerName) team.managerName = managerName;
    if (contactNumber) team.contactNumber = contactNumber;

    // ✅ Update players
    if (players) {
      let parsedPlayers = [];
      if (typeof players === 'string') parsedPlayers = JSON.parse(players);
      else if (Array.isArray(players)) parsedPlayers = players;

      team.players = await Promise.all(parsedPlayers.map(async (p) => {
        const player = {
          name: p.name || '',
          position: p.position || '',
          jerseyNumber: p.jerseyNumber ? Number(p.jerseyNumber) : null,
          code: p.playerCode || null,
          user: null,
          status: 'not_registered',
        };

        if (p.playerCode) {
          const matchedUser = await User.findOne({ playerCode: p.playerCode.trim() });
          if (matchedUser) {
            player.user = matchedUser._id;
            player.status = matchedUser.verified ? 'verified' : 'pending';
            player.name = matchedUser.name;
            player.code = matchedUser.playerCode;
          }
        }
        return player;
      }));
    }

    // ✅ Update teamLogo
    if (req.files?.teamLogo?.[0]) {
      if (team.teamLogo?.public_id) {
        await destroyPublicId(team.teamLogo.public_id);
      }
      team.teamLogo = await uploadFileToCloudinary(
        req.files.teamLogo[0].path,
        "teams/logos"
      );
    }

    // ✅ Update paymentReceipt
    if (req.files?.paymentReceipt?.[0]) {
      if (team.paymentReceipt?.public_id) {
        await destroyPublicId(team.paymentReceipt.public_id);
      }
      team.paymentReceipt = await uploadFileToCloudinary(
        req.files.paymentReceipt[0].path,
        "teams/paymentReceipts"
      );
    }

    await team.save();
    res.json({ message: '✅ Team updated successfully', team });
  } catch (err) {
    console.error('❌ Error updating team:', err);
    res.status(500).json({ message: 'Failed to update team', error: err.message });
  }
};

// ✅ Delete team
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (team.teamLogo?.public_id) {
      await destroyPublicId(team.teamLogo.public_id);
    }
    if (team.paymentReceipt?.public_id) {
      await destroyPublicId(team.paymentReceipt.public_id);
    }

    res.json({ message: '✅ Team deleted successfully' });
  } catch (err) {
    console.error('❌ Delete team error:', err);
    res.status(500).json({ message: 'Failed to delete team', error: err.message });
  }
};

// ✅ Verify / Reject
const verifyTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    team.status = 'approved';
    await team.save();
    res.json({ message: '✅ Team verified successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed' });
  }
};

const rejectTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    team.status = 'rejected';
    await team.save({ validateBeforeSave: false });
    res.json({ message: '❌ Team rejected' });
  } catch (err) {
    console.error('❌ Rejection error:', err);
    res.status(500).json({ message: 'Rejection failed', error: err.message });
  }
};

const getTeamsWithPlayers = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate({
        path: "players.user",
        match: { role: "player", verified: true },
        select: "name profileImage position playerCode role verified",
      })
      .lean();

    const teamsWithPlayers = teams.map(team => ({
      _id: team._id,
      teamName: team.teamName,
      teamCode: team.teamCode,
      teamLogo: team.teamLogo || null,
      groupName: team.groupName || null,
      seasonNumber: team.seasonNumber,
      players: (team.players || [])
        .filter(p => p.user)
        .map(p => ({
          _id: p.user._id,
          name: p.user.name,
          profileImage: p.user.profileImage || null,
          position: p.position || p.user.position || "",
          playerCode: p.user.playerCode || null,
        })),
    }));

    res.json({ success: true, teams: teamsWithPlayers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = {
  createTeam,
  getTeamsBySeason,
  getTeamById,
  updateTeam,
  deleteTeam,
  verifyTeam,
  rejectTeam,
  getTeamsWithPlayers,
};
