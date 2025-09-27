// controllers/pointsTableController.js
const Match = require("../models/matchModel");
const Season = require("../models/seasonModel");

// ----------------------
// Helpers
// ----------------------

// Convert overs string (e.g. "19.5") → total balls
const parseOvers = (overs) => {
  if (!overs) return 0;
  const [o, b] = overs.split('.').map(Number);
  return o * 6 + (b || 0);
};

// Calculate Net Run Rate (NRR)
// NRR = (runsFor / oversFaced) - (runsAgainst / oversBowled)
const calculateNRR = (runsFor, ballsFaced, runsAgainst, ballsBowled) => {
  const oversFaced = ballsFaced / 6;
  const oversBowled = ballsBowled / 6;
  if (oversFaced === 0 || oversBowled === 0) return 0;
  return (runsFor / oversFaced) - (runsAgainst / oversBowled);
};

// ----------------------
// Controller
// ----------------------
exports.getPointsTable = async (req, res) => {
  try {
    const { seasonId } = req.params;

    const season = await Season.findById(seasonId)
      .populate("groups.teams.team", "teamName teamCode teamLogo")
      .lean();

    if (!season || !season.groups?.length) {
      return res.json({ groups: {}, all: [] });
    }

    // ----------------------
    // Initialize team table
    // ----------------------
    const table = {};
    season.groups.forEach((group) => {
      group.teams.forEach((t) => {
        if (!t.team) return;
        table[String(t.team._id)] = {
          teamId: String(t.team._id),
          team: t.team.teamName,
          teamCode: t.team.teamCode,
          teamLogo: t.team.teamLogo,
          matches: 0,
          won: 0,
          lost: 0,
          tied: 0,
          points: 0,
          form: [], // track last results (W/L/T/N)
          groupName: group.groupName,
          runsFor: 0,
          ballsFaced: 0,
          runsAgainst: 0,
          ballsBowled: 0,
          nrr: 0,
        };
      });
    });

    // ----------------------
    // Process all matches
    // ----------------------
    const matches = await Match.find({ seasonNumber: seasonId })
      .select("teamA teamB teamAResult teamBResult result winner groupName")
      .lean();

    for (const m of matches) {
      const A = String(m.teamA);
      const B = String(m.teamB);

      if (!table[A] || !table[B]) continue;

      const completed = m.result === "completed";
      if (!completed) {
        table[A].form.push("N");
        table[B].form.push("N");
        continue;
      }

      const runsA = m.teamAResult?.runs || 0;
      const runsB = m.teamBResult?.runs || 0;
      const ballsA = parseOvers(m.teamAResult?.overs);
      const ballsB = parseOvers(m.teamBResult?.overs);

      table[A].matches++;
      table[B].matches++;

      // ✅ Update results & points
      if (m.winner === "teamA") {
        table[A].won++; table[A].points += 2;
        table[B].lost++;
        table[A].form.push("W"); table[B].form.push("L");
      } else if (m.winner === "teamB") {
        table[B].won++; table[B].points += 2;
        table[A].lost++;
        table[B].form.push("W"); table[A].form.push("L");
      } else if (m.winner === "tie") {
        table[A].tied++; table[B].tied++;
        table[A].points += 1; table[B].points += 1;
        table[A].form.push("T"); table[B].form.push("T");
      } else if (["draw", "no_result"].includes(m.winner)) {
        // 🆕 Award 1 point for abandoned/draw matches
        table[A].points += 1; table[B].points += 1;
        table[A].form.push("N"); table[B].form.push("N");
      } else {
        table[A].form.push("N"); table[B].form.push("N");
      }

      // Update runs & balls (for NRR)
      table[A].runsFor += runsA;
      table[A].ballsFaced += ballsA;
      table[A].runsAgainst += runsB;
      table[A].ballsBowled += ballsB;

      table[B].runsFor += runsB;
      table[B].ballsFaced += ballsB;
      table[B].runsAgainst += runsA;
      table[B].ballsBowled += ballsA;
    }

    // ----------------------
    // Finalize NRR & Sorting
    // ----------------------
    const finalize = (obj) => {
      const t = { ...obj };
      t.nrr = parseFloat(
        calculateNRR(t.runsFor, t.ballsFaced, t.runsAgainst, t.ballsBowled).toFixed(3)
      );
      return t;
    };

    const allArray = Object.values(table).map(finalize);

    const sortFn = (a, b) =>
      b.points === a.points ? b.nrr - a.nrr : b.points - a.points;

    allArray.sort(sortFn);
    allArray.forEach((t, i) => { t.position = i + 1; });

    // ----------------------
    // Group-wise sorting
    // ----------------------
    const groups = {};
    season.groups.forEach((g) => {
      groups[g.groupName] = allArray
        .filter((t) => t.groupName === g.groupName)
        .sort(sortFn)
        .map((t, idx) => ({ ...t, groupPosition: idx + 1 }));
    });

    return res.json({ groups, all: allArray });

  } catch (error) {
    console.error("❌ getPointsTable error:", error);
    res.status(500).json({ message: "Failed to fetch points table", error: error.message });
  }
};
