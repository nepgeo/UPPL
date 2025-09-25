const Team = require('../models/teamModel');
const Season = require('../models/seasonModel');
const Match = require('../models/matchModel');
const GroupSchedule = require('../models/groupScheduleModel');
const mongoose = require('mongoose');

// Utility to shuffle an array
function shuffleArray(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

// ================== GROUPS ==================

// POST /api/groups/generate/:seasonId
const generateGroups = async (req, res) => {
  try {
    const { seasonId } = req.params;

    if (!seasonId || !mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({ message: 'Invalid season ID' });
    }

    const season = await Season.findById(seasonId);
    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    const teams = await Team.find({ seasonNumber: seasonId, status: 'approved' })
      .select('_id teamName teamCode')
      .lean();

    if (teams.length < 2) {
      return res.status(400).json({ message: 'Not enough verified teams to form groups' });
    }

    const shuffled = shuffleArray(teams);

    const groups = [];
    let groupIndex = 0;
    for (let i = 0; i < shuffled.length; i += 4) {
      const chunk = shuffled.slice(i, i + 4);
      groups.push({
        groupName: String.fromCharCode(65 + groupIndex), // A, B, C...
        teams: chunk.map((t) => ({
          team: t._id,
          teamName: t.teamName,
          teamCode: t.teamCode,
        })),
      });
      groupIndex++;
    }

    // Fix: if last group has only 1 team, move one from previous
    if (groups.length > 1 && groups[groups.length - 1].teams.length === 1) {
      for (let i = 0; i < groups.length - 1; i++) {
        if (groups[i].teams.length > 2) {
          const moved = groups[i].teams.pop();
          groups[groups.length - 1].teams.push(moved);
          break;
        }
      }
    }

    await GroupSchedule.deleteMany({ seasonNumber: seasonId });

    const schedule = new GroupSchedule({
      seasonNumber: season._id,
      groups,
    });
    await schedule.save();

    season.groups = groups;
    await season.save();

    return res.json({
      message: '✅ Groups generated successfully',
      schedule,
      season,
    });
  } catch (err) {
    console.error('❌ Group generation failed:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// DELETE /api/groups/season/:seasonId
const deleteGroupsBySeason = async (req, res) => {
  try {
    const { seasonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({ message: 'Invalid season ID' });
    }

    await GroupSchedule.deleteMany({ seasonNumber: seasonId });
    await Season.findByIdAndUpdate(seasonId, { $unset: { groups: 1 } });

    return res.json({ message: '✅ Groups deleted successfully' });
  } catch (err) {
    console.error('❌ Failed to delete groups:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// ================== SEASON TIME ==================
const setScheduleTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduleGenerationTime } = req.body;

    const season = await Season.findById(id);
    if (!season) return res.status(404).json({ message: 'Season not found' });

    season.scheduleGenerationTime = new Date(scheduleGenerationTime);
    await season.save();

    return res.json({ message: '✅ Schedule time set successfully', season });
  } catch (err) {
    console.error('❌ Failed to set schedule time:', err);
    res.status(500).json({ message: 'Failed to update schedule time', error: err.message });
  }
};

// GET /api/schedule
const getSchedule = async (req, res) => {
  try {
    const schedule = await GroupSchedule.findOne()
      .sort({ createdAt: -1 })
      .populate('seasonNumber')
      .populate({ path: 'groups.teams.team', select: 'teamName teamLogo teamCode' });

    if (!schedule) return res.status(404).json({ message: 'No schedule found' });

    res.json({ schedule });
  } catch (err) {
    console.error('❌ Failed to fetch schedule:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ================== MATCHES ==================

// POST /api/matches/generate/:seasonId
const generateLeagueMatches = async (req, res) => {
  try {
    const { seasonId } = req.params;

    let season;
    if (mongoose.Types.ObjectId.isValid(seasonId)) {
      season = await Season.findById(seasonId);
    } else if (!isNaN(seasonId)) {
      season = await Season.findOne({ seasonNumber: Number(seasonId) });
    } else {
      return res.status(400).json({ message: 'Invalid season identifier' });
    }

    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    const schedule = await GroupSchedule.findOne({ seasonNumber: season._id })
      .populate({
        path: 'groups.teams.team',
        model: 'Team',
        select: '_id teamName teamCode teamLogo status',
      });

    // Delete all old league/playoff/final matches before regenerating
    await Match.deleteMany({
      seasonNumber: season._id,
      stage: { $in: ['league', 'playoff', 'final'] },
    });

    let matchesToInsert = [];
    let approvedTeams = [];

    if (schedule && schedule.groups?.length > 0) {
      for (const group of schedule.groups) {
        const groupTeamIds = group.teams
          .filter(t => t?.team && (t.team.status || '').toLowerCase().trim() === 'approved')
          .map(t => t.team._id.toString());

        approvedTeams.push(...groupTeamIds);

        for (let i = 0; i < groupTeamIds.length; i++) {
          for (let j = i + 1; j < groupTeamIds.length; j++) {
            matchesToInsert.push({
              seasonNumber: season._id,
              stage: 'league',
              groupName: group.groupName,
              teamA: groupTeamIds[i],
              teamB: groupTeamIds[j],
              matchTime: new Date(),
              venue: '',
              result: 'upcoming',
            });
          }
        }
      }
    } else {
      approvedTeams = await Team.find(
        { seasonNumber: season._id, status: { $regex: /^approved$/i } },
        '_id'
      ).then(teams => teams.map(t => t._id.toString()));
    }

    approvedTeams = [...new Set(approvedTeams.map(id => id.toString()))];

    let matchNumber = 1;
    const savedLeagueMatches = [];
    for (const matchData of matchesToInsert) {
      const saved = await Match.create({ ...matchData, matchNumber: matchNumber++ });
      savedLeagueMatches.push(saved);
    }

    // ❌ Removed auto-generation of playoff & final matches

    // Update season with only league matches
    season.teams = approvedTeams;
    season.matches = savedLeagueMatches.map(m => m._id);
    await season.save();

    return res.json({
      message: '✅ League matches generated successfully (no playoff/final auto-created)',
      leagueMatches: savedLeagueMatches.length,
      totalMatches: savedLeagueMatches.length,
      season,
    });
  } catch (err) {
    console.error('❌ Failed to generate league matches:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};


// DELETE /api/matches/season/:seasonId
const deleteMatchesBySeason = async (req, res) => {
  try {
    const { seasonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({ message: 'Invalid season ID' });
    }

    await Match.deleteMany({ seasonNumber: seasonId });
    await Season.findByIdAndUpdate(seasonId, { $unset: { matches: 1 } });

    return res.json({ message: '✅ Matches deleted successfully' });
  } catch (err) {
    console.error('❌ Failed to delete matches:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// ================== EXPORTS ==================
module.exports = {
  generateGroups,
  deleteGroupsBySeason,
  setScheduleTime,
  getSchedule,
  generateLeagueMatches,
  deleteMatchesBySeason,
};
