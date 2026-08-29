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
          catches: 0, stumpings: 0,
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

module.exports = { aggregatePlayerStatsForMatch, aggregateAllPlayerStats };
