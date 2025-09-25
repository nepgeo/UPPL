const Team = require('../models/teamModel');
const Season = require('../models/seasonModel');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');



// Utility to generate 4-character team code
function generateTeamCode(teamId) {
  const shortId = teamId.toString().slice(-4);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomChar = alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${randomChar}${shortId.toUpperCase()}`;
}

const createTeam = async (req, res) => {
  try {
    console.log("📦 req.body:", req.body);
    console.log("📂 req.files:", req.files);
    console.log("👤 req.user:", req.user);

    const { seasonNumber } = req.body;

    // 1. Validate seasonId properly
    if (
      !mongoose.Types.ObjectId.isValid(seasonNumber) ||
      String(new mongoose.Types.ObjectId(seasonNumber)) !== seasonNumber
    ) {
      return res.status(400).json({ message: "❌ Invalid season ID" });
    }

    // 2. Check Season exists
    const season = await Season.findById(seasonNumber);
    if (!season) {
      return res.status(404).json({ message: "❌ Season not found" });
    }

    // 3. Parse files
    const paymentReceiptFile = req.files?.find(
      (file) => file.fieldname.trim() === "paymentReceipt"
    );
    const teamLogoFile = req.files?.find(
      (file) => file.fieldname.trim() === "teamLogo"
    );

    const paymentReceiptPath = paymentReceiptFile?.path;
    const teamLogoPath = teamLogoFile?.path || "";

    if (!paymentReceiptPath) {
      return res
        .status(400)
        .json({ message: "❌ Payment receipt file is required." });
    }

    // 4. Parse players
    let players = [];
    if (req.body.players) {
      try {
        players = JSON.parse(req.body.players);
      } catch (err) {
        return res
          .status(400)
          .json({ message: "❌ Invalid players data format" });
      }
    }

    // 5. Prepare players
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

    // 6. Save team (with TEMP code first)
    const newTeam = new Team({
      teamName: req.body.teamName,
      captainName: req.body.captainName,
      coachName: req.body.coachName || "",
      managerName: req.body.managerName || "",
      contactNumber: req.body.contactNumber || "",
      seasonNumber: new mongoose.Types.ObjectId(seasonNumber),
      groupName: req.body.groupName || null,
      createdBy: req.user?.id,
      paymentReceipt: paymentReceiptPath,
      teamLogo: teamLogoPath,
      players: preparedPlayers,
      teamCode: "TEMP", // will update after saving
    });

    await newTeam.save();

    // 7. Generate and update teamCode
    const finalCode = generateTeamCode(newTeam._id);
    newTeam.teamCode = finalCode;
    await newTeam.save();

    // 8. Push team into correct group inside Season
    let group = season.groups.find(
      (g) => g.groupName === req.body.groupName
    );

    if (!group) {
      // create new group if it doesn't exist
      group = { groupName: req.body.groupName || "Ungrouped", teams: [] };
      season.groups.push(group);
    }

    group.teams.push({
      team: newTeam._id,
      teamName: newTeam.teamName,
      teamCode: newTeam.teamCode,
    });

    await season.save();

    res.status(201).json({
      message: "✅ Team registered successfully",
      team: newTeam,
    });
  } catch (err) {
    console.error("❌ Team creation failed:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};



// ✅ Get all teams by season
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
    path: 'players.user', // 🔥 populate user inside players
    select: 'name email phone profileImage documents playerCode role position dateOfBirth battingStyle bowlingStyle bio',
  })
  .lean();


    // Map and normalize team data
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


// ✅ Get all teams with their verified players
const getTeamsWithPlayers = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate({
        path: "players.user",
        match: { role: "player", verified: true }, // only verified players
        select: "name profileImage position playerCode role verified",
      })
      .lean();

    // Normalize players array (filter out nulls in case of missing users)
    const teamsWithPlayers = teams.map((team) => {
      const verifiedPlayers = (team.players || [])
        .map((p) => {
          if (!p.user) return null; // skip null refs
          return {
            _id: p.user._id,
            name: p.user.name,
            profileImage: p.user.profileImage || null,
            position: p.position || p.user.position || "",
            playerCode: p.user.playerCode || null,
          };
        })
        .filter(Boolean);

      return {
        _id: team._id,
        teamName: team.teamName,
        teamCode: team.teamCode,
        teamLogo: team.teamLogo || null,
        groupName: team.groupName || null,
        seasonNumber: team.seasonNumber,
        players: verifiedPlayers,
      };
    });

    res.json({ success: true, teams: teamsWithPlayers });
  } catch (err) {
    console.error("❌ Error fetching teams with players:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
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

      console.log('Fetched Team:', JSON.stringify(team, null, 2));

    if (!team) return res.status(404).json({ message: 'Team not found' });

    res.json(team);
  } catch (err) {
    console.error('Error fetching team:', err);
    res.status(500).json({ message: 'Failed to fetch team', error: err.message });
  }
};




const updateTeam = async (req, res) => {
  try {
    const teamId = req.params.id;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const {
      teamName,
      captainName,
      coachName,
      managerName,
      contactNumber,
      players, // can be stringified or object
    } = req.body;

    // ✅ Basic fields
    if (teamName) team.teamName = teamName;
    if (captainName) team.captainName = captainName;
    if (coachName) team.coachName = coachName;
    if (managerName) team.managerName = managerName;
    if (contactNumber) team.contactNumber = contactNumber;

    // ✅ Parse players array safely
    // ✅ Parse and resolve players
    let parsedPlayers = [];

    if (players) {
      if (typeof players === 'string') {
        try {
          parsedPlayers = JSON.parse(players);
        } catch (err) {
          console.error('❌ Failed to parse players JSON:', err);
          return res.status(400).json({ message: 'Invalid players format (not valid JSON)' });
        }
      } else if (Array.isArray(players)) {
        parsedPlayers = players;
      } else {
        return res.status(400).json({ message: 'Invalid players format (not array or string)' });
      }

      // Map each player to backend structure
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
          const trimmedCode = p.playerCode.toString().trim();
          const matchedUser = await User.findOne({ playerCode: trimmedCode });

          if (matchedUser) {
            player.user = matchedUser._id;
            player.status = matchedUser.verified ? 'verified' : 'pending';
            player.name = matchedUser.name;
            player.code = matchedUser.playerCode;
          } else {
            console.warn(`⚠️ No user found with playerCode "${trimmedCode}"`);
          }
        }

        return player;
      }));
    }


    // ✅ Handle team logo
    if (req.files?.teamLogo?.[0]) {
      if (team.teamLogo && fs.existsSync(team.teamLogo)) {
        fs.unlinkSync(team.teamLogo); // optional: delete old
      }
      team.teamLogo = req.files.teamLogo[0].path.replace(/\\/g, '/');
    }

    // ✅ Handle payment receipt
    if (req.files?.paymentReceipt?.[0]) {
      if (team.paymentReceipt && fs.existsSync(team.paymentReceipt)) {
        fs.unlinkSync(team.paymentReceipt); // optional: delete old
      }
      team.paymentReceipt = req.files.paymentReceipt[0].path.replace(/\\/g, '/');
    }

    await team.save();
    return res.json({ message: '✅ Team updated successfully', team });
  } catch (err) {
    console.error('❌ Error updating team:', err);
    return res.status(500).json({ message: 'Failed to update team', error: err.message });
  }
};

// ✅ Delete a team
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Delete team logo if it exists
    if (team.teamLogo) {
      const logoPath = path.join(__dirname, '..', team.teamLogo);
      if (fs.existsSync(logoPath)) {
        fs.unlink(logoPath, (err) => {
          if (err) console.error('Error deleting logo:', err.message);
        });
      }
    }

    // Delete payment receipt if it exists
    if (team.paymentReceipt) {
      const receiptPath = path.join(__dirname, '..', team.paymentReceipt);
      if (fs.existsSync(receiptPath)) {
        fs.unlink(receiptPath, (err) => {
          if (err) console.error('Error deleting receipt:', err.message);
        });
      }
    }

    res.json({ message: '✅ Team deleted successfully' });
  } catch (err) {
    console.error('❌ Delete team error:', err);
    res.status(500).json({ message: 'Failed to delete team', error: err.message });
  }
};


// ✅ Approve team
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

// ✅ Reject team
const rejectTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    team.status = 'rejected';
    await team.save({ validateBeforeSave: false });

    res.json({ message: '❌ Team rejected' });
  } catch (err) {
    console.error('❌ Rejection error:', err); // ✅ Add this
    res.status(500).json({ message: 'Rejection failed', error: err.message });
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

