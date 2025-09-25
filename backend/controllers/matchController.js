const mongoose = require('mongoose');
const Match = require('../models/matchModel');
const Season = require('../models/seasonModel');

// ----------------------
// Helpers
// ----------------------

// Convert overs string (e.g., "19.5") into decimal overs
function parseOvers(overs) {
  if (!overs || overs === "") return 0;
  const s = String(overs);
  if (!s.includes('.')) return parseInt(s, 10) || 0;
  const [oPart, bPart] = s.split('.');
  const oversNum = parseInt(oPart, 10) || 0;
  const balls = Math.min(Math.max(parseInt(bPart, 10) || 0, 0), 5);
  return oversNum + balls / 6;
}

// Safe number conversion
function safeNumber(val) {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

// Compute match margin
function computeMargin(teamAResult, teamBResult, winner) {
  const aRuns = safeNumber(teamAResult.runs);
  const aWkts = safeNumber(teamAResult.wickets);
  const bRuns = safeNumber(teamBResult.runs);
  const bWkts = safeNumber(teamBResult.wickets);

  if (winner === 'teamA') {
    const runsDiff = Math.abs(aRuns - bRuns);
    const wicketsLeft = 10 - aWkts;
    return `${runsDiff} run${runsDiff === 1 ? '' : 's'}, ${wicketsLeft} wicket${wicketsLeft === 1 ? '' : 's'}`;
  }

  if (winner === 'teamB') {
    const runsDiff = Math.abs(bRuns - aRuns);
    const wicketsLeft = 10 - bWkts;
    return `${runsDiff} run${runsDiff === 1 ? '' : 's'}, ${wicketsLeft} wicket${wicketsLeft === 1 ? '' : 's'}`;
  }

  if (winner === 'tie') {
    return 'tie';
  }

  if (winner === 'no_result') {
    return 'No Result';
  }

  return null;
}



// ----------------------
// Match Controllers
// ----------------------

// Create Match
const createMatch = async (req, res) => {
  try {
    const { seasonNumber, stage, groupName, teamA, teamB, venue, matchTime } = req.body;

    if (!seasonNumber || !stage || !teamA || !teamB || !matchTime) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    if (!mongoose.Types.ObjectId.isValid(seasonNumber)) {
      return res.status(400).json({ message: 'Invalid season ID' });
    }

    const season = await Season.findById(seasonNumber);
    if (!season) return res.status(404).json({ message: 'Season not found' });

    const newMatch = new Match({
      seasonNumber: new mongoose.Types.ObjectId(seasonNumber),
      stage,
      groupName: groupName || null,
      teamA,
      teamB,
      venue: venue || '',
      matchTime
    });

    await newMatch.save();

    season.matches.push(newMatch._id);
    await season.save();

    res.status(201).json({ message: '✅ Match created successfully', match: newMatch });
  } catch (error) {
    console.error('❌ Failed to create match:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Update Match (basic updates)
const updateMatch = async (req, res) => {
  try {
    const matchId = req.params.id;
    const updates = req.body;

    const updated = await Match.findByIdAndUpdate(matchId, updates, { new: true });
    if (!updated) return res.status(404).json({ error: 'Match not found' });

    res.status(200).json({ message: '✅ Match updated', match: updated });
  } catch (err) {
    console.error('❌ Failed to update match:', err);
    res.status(500).json({ error: 'Failed to update match', details: err.message });
  }
};

// Update Match Result
const updateMatchResult = async (req, res) => {
  try {
    const { id } = req.params;
    let { teamAResult = {}, teamBResult = {}, winner } = req.body;

    // 🔍 Log raw payload exactly as it arrived from frontend
    console.log("📩 RAW payload from frontend:", req.body);

    console.log("📤 Incoming result payload (destructured):", { teamAResult, teamBResult, winner });

    // Safely convert all numbers
    teamAResult = {
      runs: safeNumber(teamAResult.runs),
      wickets: safeNumber(teamAResult.wickets),
      overs: teamAResult?.overs ?? "0",
    };

    teamBResult = {
      runs: safeNumber(teamBResult.runs),
      wickets: safeNumber(teamBResult.wickets),
      overs: teamBResult?.overs ?? "0",
    };

    // 🔍 Log after conversion
    console.log("🧹 Sanitized team results:", { teamAResult, teamBResult });

    // Fetch match
    const match = await Match.findById(id);
    if (!match) {
      console.warn("⚠️ Match not found with id:", id);
      return res.status(404).json({ message: "Match not found" });
    }

    match.teamAResult = teamAResult;
    match.teamBResult = teamBResult;
    match.result = "completed";

    // Determine winner & margin
    if (["teamA", "teamB"].includes(winner)) {
      match.winner = winner;
      match.margin = computeMargin(teamAResult, teamBResult, winner);
    } else if (["tie", "draw", "no_result"].includes(winner)) {
      match.winner = winner;
      match.margin = winner;
    } else {
      match.winner = null;
      match.margin = null;
    }

    // 🔍 Log the calculated outcome
    console.log("✅ Calculated outcome:", {
      winner: match.winner,
      margin: match.margin,
    });

    await match.save();

    console.log("💾 Saved match result successfully:", match._id);

    res.json({ message: "✅ Match result updated", match });
  } catch (err) {
    console.error("❌ Failed to update match result:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};


// Delete Match
const deleteMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const match = await Match.findById(id);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    if (match.fixed) {
      return res.status(403).json({ message: '🚫 Cannot delete fixed match' });
    }

    await Match.findByIdAndDelete(id);
    res.json({ message: '🗑️ Match deleted successfully' });
  } catch (err) {
    console.error('❌ Failed to delete match:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// Get Matches
const getMatches = async (req, res) => {
  try {
    const { seasonNumber, stage } = req.query;
    const query = {};
    if (seasonNumber) query.seasonNumber = seasonNumber;
    if (stage) query.stage = stage;

    const matches = await Match.find(query)
      .populate('teamA teamB', 'teamName teamCode teamLogo')
      .sort({ matchTime: 1 });

    const safeMatches = matches.map((match) => {
      const teamA = match.teamA
        ? {
            ...match.teamA.toObject(),
            runs: safeNumber(match.teamAResult?.runs),
            wickets: safeNumber(match.teamAResult?.wickets),
            overs: match.teamAResult?.overs ?? "0",
          }
        : { teamName: 'TBD', teamLogo: null, teamCode: null, runs: 0, wickets: 0, overs: "0" };

      const teamB = match.teamB
        ? {
            ...match.teamB.toObject(),
            runs: safeNumber(match.teamBResult?.runs),
            wickets: safeNumber(match.teamBResult?.wickets),
            overs: match.teamBResult?.overs ?? "0",
          }
        : { teamName: 'TBD', teamLogo: null, teamCode: null, runs: 0, wickets: 0, overs: "0" };

      return {
        _id: match._id,
        seasonNumber: match.seasonNumber,
        stage: match.stage,
        venue: match.venue,
        matchTime: match.matchTime,
        result: match.result ?? 'pending',
        winner: match.winner ?? null,
        margin: match.margin ?? null,
        status: match.status ?? null,
        teamA,
        teamB,
      };
    });

    res.json({ matches: safeMatches });
  } catch (err) {
    console.error('❌ Failed to get matches:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// Delete all matches by season
const deleteMatchesBySeason = async (req, res) => {
  try {
    const { seasonId } = req.params;
    const result = await Match.deleteMany({ seasonNumber: seasonId });
    res.status(200).json({ message: `Deleted ${result.deletedCount} matches for season ${seasonId}` });
  } catch (error) {
    console.error('❌ Failed to delete matches by season:', error);
    res.status(500).json({ message: 'Failed to delete matches by season' });
  }
};

module.exports = {
  createMatch,
  updateMatch,
  updateMatchResult,
  deleteMatch,
  getMatches,
  deleteMatchesBySeason,
};
