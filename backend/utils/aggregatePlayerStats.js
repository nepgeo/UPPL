const Match = require('../models/matchModel');
const Player = require('../models/Player');
const User = require('../models/User');

async function aggregatePlayerStatsForMatch(matchId) {
  try {
    const match = await Match.findById(matchId);
    if (!match || match.result !== 'completed') return { updated: 0, errors: [] };

    const playerStats = match.playerStats;
    if (!playerStats) return { updated: 0, errors: [] };

    const battingStats = playerStats.batting || [];
    const bowlingStats = playerStats.bowling || [];

    const allStatNames = new Set([
      ...battingStats.map(b => b.playerName),
      ...bowlingStats.map(b => b.playerName),
    ]);
    if (allStatNames.size === 0) return { updated: 0, errors: [] };

    const users = await User.find({ name: { $in: Array.from(allStatNames) } }).lean();
    const nameToUser = {};
    users.forEach(u => { nameToUser[u.name] = u; });

    const players = await Player.find({ userId: { $in: users.map(u => u._id) } });
    const userIdToPlayer = {};
    players.forEach(p => { userIdToPlayer[String(p.userId)] = p; });

    const touchedUserIds = new Set();
    let updated = 0;
    const errors = [];

    for (const batStat of battingStats) {
      const user = nameToUser[batStat.playerName];
      if (!user) { errors.push(`No user found for batsman: ${batStat.playerName}`); continue; }

      let player = userIdToPlayer[String(user._id)];
      if (!player) {
        player = new Player({
          userId: user._id,
          position: user.position || 'batsman',
          verified: user.verified || false,
          careerStats: {
            matches: 0, innings: 0, runs: 0, ballsFaced: 0,
            fours: 0, sixes: 0, highestScore: 0, notOuts: 0,
            wickets: 0, ballsBowled: 0, runsConceded: 0,
            bestBowlingWickets: 0, bestBowlingRuns: 0,
            economy: 0, strikeRate: 0, average: 0,
            catches: 0, stumpings: 0,
          },
        });
        userIdToPlayer[String(user._id)] = player;
      }

      touchedUserIds.add(String(user._id));
      const cs = player.careerStats;
      cs.innings += 1;
      cs.runs += batStat.runs || 0;
      cs.ballsFaced += batStat.balls || 0;
      cs.fours += batStat.fours || 0;
      cs.sixes += batStat.sixes || 0;

      if (!batStat.out) {
        cs.notOuts += 1;
      }

      if ((batStat.runs || 0) > cs.highestScore) {
        cs.highestScore = batStat.runs || 0;
      }

      cs.strikeRate = cs.ballsFaced > 0
        ? parseFloat(((cs.runs / cs.ballsFaced) * 100).toFixed(2))
        : 0;
      cs.average = (cs.innings - cs.notOuts) > 0
        ? parseFloat((cs.runs / (cs.innings - cs.notOuts)).toFixed(2))
        : cs.runs > 0 ? cs.runs : 0;

      player.careerStats = cs;
      await player.save();
      updated++;
    }

    for (const bowlStat of bowlingStats) {
      const user = nameToUser[bowlStat.playerName];
      if (!user) { errors.push(`No user found for bowler: ${bowlStat.playerName}`); continue; }

      let player = userIdToPlayer[String(user._id)];
      if (!player) {
        player = new Player({
          userId: user._id,
          position: user.position || 'bowler',
          verified: user.verified || false,
          careerStats: {
            matches: 0, innings: 0, runs: 0, ballsFaced: 0,
            fours: 0, sixes: 0, highestScore: 0, notOuts: 0,
            wickets: 0, ballsBowled: 0, runsConceded: 0,
            bestBowlingWickets: 0, bestBowlingRuns: 0,
            economy: 0, strikeRate: 0, average: 0,
            catches: 0, stumpings: 0,
          },
        });
        userIdToPlayer[String(user._id)] = player;
      }

      touchedUserIds.add(String(user._id));
      const cs = player.careerStats;
      cs.ballsBowled += bowlStat.balls || 0;
      cs.runsConceded += bowlStat.runs || 0;
      cs.wickets += bowlStat.wickets || 0;

      if ((bowlStat.wickets || 0) > cs.bestBowlingWickets) {
        cs.bestBowlingWickets = bowlStat.wickets || 0;
        cs.bestBowlingRuns = bowlStat.runs || 0;
      } else if ((bowlStat.wickets || 0) === cs.bestBowlingWickets && (bowlStat.runs || 0) < cs.bestBowlingRuns) {
        cs.bestBowlingRuns = bowlStat.runs || 0;
      }

      cs.economy = cs.ballsBowled > 0
        ? parseFloat(((cs.runsConceded / cs.ballsBowled) * 6).toFixed(2))
        : 0;

      player.careerStats = cs;
      await player.save();
      updated++;
    }

    for (const pid of touchedUserIds) {
      const player = userIdToPlayer[pid];
      if (player) {
        player.careerStats.matches += 1;
        await player.save();
      }
    }

    // Increment manOfTheMatch count for POTM player
    if (match.playerOfTheMatch?.playerName) {
      const potmUser = nameToUser[match.playerOfTheMatch.playerName];
      if (potmUser) {
        const potmPlayer = userIdToPlayer[String(potmUser._id)];
        if (potmPlayer) {
          potmPlayer.careerStats.manOfTheMatch = (potmPlayer.careerStats.manOfTheMatch || 0) + 1;
          await potmPlayer.save();
        }
      }
    }

    return { updated, errors };
  } catch (err) {
    console.error('Failed to aggregate stats for match', matchId, err);
    return { updated: 0, errors: [err.message] };
  }
}

async function aggregateAllPlayerStats() {
  try {
    // Reset all career stats first
    await Player.updateMany({}, {
      $set: {
        careerStats: {
          matches: 0, innings: 0, runs: 0, ballsFaced: 0,
          fours: 0, sixes: 0, highestScore: 0, notOuts: 0,
          wickets: 0, ballsBowled: 0, runsConceded: 0,
          bestBowlingWickets: 0, bestBowlingRuns: 0,
          economy: 0, strikeRate: 0, average: 0,
          catches: 0, stumpings: 0, manOfTheMatch: 0,
        },
      },
    });

    const completedMatches = await Match.find({ result: 'completed' }).select('_id');
    console.log(`Found ${completedMatches.length} completed matches to aggregate`);

    let totalUpdated = 0;
    const allErrors = [];

    for (const match of completedMatches) {
      const result = await aggregatePlayerStatsForMatch(match._id);
      totalUpdated += result.updated;
      allErrors.push(...result.errors);
    }

    const players = await Player.countDocuments({});
    const playersWithStats = await Player.countDocuments({
      'careerStats.runs': { $gt: 0 },
    });

    return {
      totalMatches: completedMatches.length,
      totalPlayerUpdates: totalUpdated,
      totalPlayers: players,
      playersWithStats,
      errors: allErrors,
    };
  } catch (err) {
    console.error('Failed to aggregate all player stats:', err);
    return { error: err.message };
  }
}

/**
 * Calculate Player of the Match from match stats.
 * Uses a points system:
 * - Batting: runs * 1 + (runs >= 50 ? 20 : 0) + (runs >= 100 ? 30 : 0) + fours * 1 + sixes * 2 + (strikeRate > 150 ? 10 : 0)
 * - Bowling: wickets * 25 + (wickets >= 3 ? 10 : 0) + (wickets >= 5 ? 20 : 0) + (economy < 6 ? 10 : 0) + (economy < 4 ? 10 : 0)
 * - All-round: bonus for contributing with both bat and ball
 */
function calculatePlayerOfTheMatch(playerStats) {
  const batting = playerStats?.batting || [];
  const bowling = playerStats?.bowling || [];

  // Build a map of all players
  const playerMap = {};

  for (const b of batting) {
    const name = b.playerName;
    if (!name) continue;
    if (!playerMap[name]) playerMap[name] = { playerName: name, team: b.team || '', batPoints: 0, bowlPoints: 0, totalPoints: 0, batting: null, bowling: null };
    const runs = b.runs || 0;
    const balls = b.balls || 0;
    const fours = b.fours || 0;
    const sixes = b.sixes || 0;
    const sr = balls > 0 ? (runs / balls) * 100 : 0;

    let points = runs * 1;
    if (runs >= 50) points += 20;
    if (runs >= 100) points += 30;
    points += fours * 1;
    points += sixes * 2;
    if (sr > 150 && balls >= 10) points += 10;
    if (sr > 200 && balls >= 10) points += 10;

    playerMap[name].batPoints = points;
    playerMap[name].batting = { runs, balls, fours, sixes, strikeRate: parseFloat(sr.toFixed(1)) };
  }

  for (const bw of bowling) {
    const name = bw.playerName;
    if (!name) continue;
    if (!playerMap[name]) playerMap[name] = { playerName: name, team: bw.team || '', batPoints: 0, bowlPoints: 0, totalPoints: 0, batting: null, bowling: null };
    const wickets = bw.wickets || 0;
    const runs = bw.runs || 0;
    const balls = bw.balls || 0;
    const overs = `${Math.floor(balls / 6)}.${balls % 6}`;
    const econ = balls > 0 ? (runs / balls) * 6 : 0;

    let points = wickets * 25;
    if (wickets >= 3) points += 10;
    if (wickets >= 5) points += 20;
    if (econ < 6 && balls >= 12) points += 10;
    if (econ < 4 && balls >= 12) points += 10;
    // Maiden overs bonus
    if ((bw.maidens || 0) > 0) points += bw.maidens * 5;

    playerMap[name].bowlPoints = points;
    playerMap[name].bowling = { wickets, runs, overs, economy: parseFloat(econ.toFixed(2)) };
  }

  // Calculate total points and all-round bonus
  let bestPlayer = null;
  let bestPoints = -1;

  for (const name of Object.keys(playerMap)) {
    const p = playerMap[name];
    p.totalPoints = p.batPoints + p.bowlPoints;
    // All-round bonus: contributing with both bat and ball
    if (p.batPoints > 10 && p.bowlPoints > 10) {
      p.totalPoints += 15;
    }
    if (p.totalPoints > bestPoints) {
      bestPoints = p.totalPoints;
      bestPlayer = p;
    }
  }

  if (!bestPlayer) return null;

  // Build reason string
  const reasons = [];
  if (bestPlayer.batting) {
    const b = bestPlayer.batting;
    reasons.push(`${b.runs} runs (${b.balls} balls, ${b.fours}×4, ${b.sixes}×6)`);
  }
  if (bestPlayer.bowling) {
    const bw = bestPlayer.bowling;
    reasons.push(`${bw.wickets} wickets for ${bw.runs} runs in ${bw.overs} overs`);
  }

  return {
    playerName: bestPlayer.playerName,
    team: bestPlayer.team,
    reason: reasons.join(' | '),
    battingRuns: bestPlayer.batting?.runs || 0,
    battingBalls: bestPlayer.batting?.balls || 0,
    bowlingWickets: bestPlayer.bowling?.wickets || 0,
    bowlingRuns: bestPlayer.bowling?.runs || 0,
    bowlingOvers: bestPlayer.bowling?.overs || '0',
    points: bestPlayer.totalPoints,
  };
}

module.exports = { aggregatePlayerStatsForMatch, aggregateAllPlayerStats, calculatePlayerOfTheMatch };
