// controllers/pointsTableController.js
const Match = require("../models/matchModel");
const Season = require("../models/seasonModel");

// ----------------------
// Helpers
// ----------------------

// Convert overs string (e.g. "19.5") → total balls
const parseOvers = (overs) => {
  if (!overs && overs !== 0) return 0;
  const str = String(overs);
  // Normalize formats like "20", "20.0", "19.5"
  const parts = str.split(".");
  const o = parseInt(parts[0], 10) || 0;
  const b = parts[1] ? (parseInt(parts[1].slice(0, 2), 10) || 0) : 0;
  // ensure balls part is not more than 5 (e.g., "19.8" -> treat 8 as 8 balls but clamp to 5 to avoid nonsense)
  const safeBalls = Math.min(Math.max(b, 0), 5);
  return o * 6 + safeBalls;
};

// Calculate Net Run Rate (NRR)
// NRR = (runsFor / oversFaced) - (runsAgainst / oversBowled)
const calculateNRR = (runsFor, ballsFaced, runsAgainst, ballsBowled) => {
  const oversFaced = ballsFaced / 6;
  const oversBowled = ballsBowled / 6;
  if (oversFaced === 0 || oversBowled === 0) return 0;
  return (runsFor / oversFaced) - (runsAgainst / oversBowled);
};

// Safe division for per-match run-rate (runs / overs)
const runRate = (runs, balls) => {
  if (!balls || balls === 0) return 0;
  return runs / (balls / 6);
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
      return res.json({ success: true, groups: {}, all: [] });
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
      .select("teamA teamB teamAResult teamBResult result winner firstInnings groupName")
      .lean();

    for (const m of matches) {
      const A = String(m.teamA);
      const B = String(m.teamB);
      if (!table[A] || !table[B]) continue;

      const completed = ["teamA", "teamB", "tie"].includes(m.winner);
      if (!completed) {
        // not completed — mark as N (no result / not played) for both
        table[A].form.push("N");
        table[B].form.push("N");
        continue;
      }

      // Read raw stored match stats
      let runsA = m.teamAResult?.runs ?? 0;
      let runsB = m.teamBResult?.runs ?? 0;
      let ballsA = parseOvers(m.teamAResult?.overs ?? "0");
      let ballsB = parseOvers(m.teamBResult?.overs ?? "0");

      // -----------------------------
      // Auto-detect inversion fallback:
      // Determine per-match run-rate from stored stats.
      // If the per-match run-rate sign is inconsistent with declared winner,
      // we assume the stored results are innings-ordered and not team-ordered,
      // so we swap A/B for this match before accumulating.
      // -----------------------------
      const rrA = runRate(runsA, ballsA);
      const rrB = runRate(runsB, ballsB);
      const matchRRdiffA = rrA - rrB; // positive means A outscored B in run-rate in this match

      // If winner is teamA but their match run-rate < opponent's, that's suspicious -> swap
      // If winner is teamB but their match run-rate < opponent's, that's suspicious -> swap
      // For tie we don't swap.
      if (m.winner === "teamA" && matchRRdiffA < 0) {
        // swap A/B values for this match
        [runsA, runsB] = [runsB, runsA];
        [ballsA, ballsB] = [ballsB, ballsA];
      } else if (m.winner === "teamB" && matchRRdiffA > 0) {
        // A's run-rate is higher but winner says teamB -> swap
        [runsA, runsB] = [runsB, runsA];
        [ballsA, ballsB] = [ballsB, ballsA];
      }
      // Note: this is a heuristic fallback — it handles the common "stored by innings" mismatch.
      // If you have edge cases where winner legitimately has lower run-rate in a match, consider storing explicit 'firstInnings' in match docs.

      // Update match counts
      table[A].matches++;
      table[B].matches++;

      // ✅ Update results & points
      if (m.winner === "teamA") {
        table[A].won++;
        table[A].points += 2;
        table[B].lost++;
        table[A].form.push("W");
        table[B].form.push("L");
      } else if (m.winner === "teamB") {
        table[B].won++;
        table[B].points += 2;
        table[A].lost++;
        table[B].form.push("W");
        table[A].form.push("L");
      } else if (m.winner === "tie") {
        table[A].tied++;
        table[B].tied++;
        table[A].points += 1;
        table[B].points += 1;
        table[A].form.push("T");
        table[B].form.push("T");
      } else if (["draw", "no_result"].includes(m.winner)) {
        table[A].points += 1;
        table[B].points += 1;
        table[A].form.push("N");
        table[B].form.push("N");
      } else {
        table[A].form.push("N");
        table[B].form.push("N");
      }

      // ✅ Update runs & balls (NRR accumulators)
      table[A].runsFor += runsA;
      table[A].ballsFaced += ballsA;
      table[A].runsAgainst += runsB;
      table[A].ballsBowled += ballsB;

      table[B].runsFor += runsB;
      table[B].ballsFaced += ballsB;
      table[B].runsAgainst += runsA;
      table[B].ballsBowled += ballsA;

      // Trim form arrays to last 5 results
      table[A].form = table[A].form.slice(-5);
      table[B].form = table[B].form.slice(-5);
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

    // Sort by points → NRR
    const sortFn = (a, b) => b.points - a.points || b.nrr - a.nrr;

    allArray.sort(sortFn);
    allArray.forEach((t, i) => (t.position = i + 1));

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

    return res.json({ success: true, groups, all: allArray });
  } catch (error) {
    console.error("❌ getPointsTable error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch points table",
      error: error.message,
    });
  }
};
