const Match = require('../models/matchModel');
const Ball = require('../models/Ball');
const { getIo } = require('../socket');
const { computeMatchState } = require('../utils/scoreCalculator');

exports.addBall = async (req, res) => {
  try {
    const matchId = req.params.id;
    const event = req.body;
    const userId = req.user?._id;

    if (!matchId) return res.status(400).json({ message: 'matchId required' });
    if (typeof event.over !== 'number' || typeof event.ball !== 'number') {
      return res.status(400).json({ message: 'over and ball must be numbers' });
    }

    const match = await Match.findById(matchId).populate('teamA teamB');
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.result !== 'live') return res.status(400).json({ message: 'Match is not live' });

    const battingTeam = event.battingTeam || match.battingFirst || 'teamA';
    const bowlingTeam = battingTeam === 'teamA' ? 'teamB' : 'teamA';
    const runs = Number(event.runs || 0);
    const extrasRuns = Number((event.extras && event.extras.runs) || 0);
    const totalRuns = runs + extrasRuns;
    const isLegalDelivery = !event.extras || (event.extras.type !== 'wide' && event.extras.type !== 'no_ball');
    const isFour = runs === 4 && isLegalDelivery;
    const isSix = runs === 6 && isLegalDelivery;
    const isByeLegBye = event.extras && (event.extras.type === 'bye' || event.extras.type === 'leg_bye');

    const ballEvent = {
      ...event,
      battingTeam,
      isFour,
      isSix,
      runs,
      extras: event.extras || { type: null, runs: 0 },
      wicket: event.wicket || false,
    };

    match.events.push(ballEvent);

    // Update innings score (computed)
    const score = match.score[battingTeam];
    if (!match.score) {
      match.score = {
        teamA: { battingTeam: 'teamA', runs: 0, wickets: 0, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 },
        teamB: { battingTeam: 'teamB', runs: 0, wickets: 0, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 },
      };
    }
    if (!match.score[battingTeam]) {
      match.score[battingTeam] = { battingTeam, runs: 0, wickets: 0, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 };
    }

    score.runs += totalRuns;
    if (isLegalDelivery) {
      score.balls += 1;
    }
    if (event.wicket) score.wickets += 1;
    if (extrasRuns > 0) score.extras += extrasRuns;
    if (isFour) score.fours += 1;
    if (isSix) score.sixes += 1;
    score.runRate = parseFloat(((score.runs / (score.balls || 1)) * 6).toFixed(2));

    // Track current over
    if (event.over !== match.currentOverNumber) {
      match.currentOver = [];
      match.currentOverNumber = event.over;
    }
    match.currentOver.push(ballEvent);

    // Update player batting stats
    if (event.batsman) {
      let batStat = match.playerStats.batting.find(
        b => b.playerName === event.batsman && b.team === battingTeam
      );
      if (!batStat) {
        match.playerStats.batting.push({
          playerName: event.batsman,
          team: battingTeam,
          runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissalType: '', bowledBy: '',
          strikeRate: 0,
        });
        batStat = match.playerStats.batting[match.playerStats.batting.length - 1];
      }
      if (isLegalDelivery) {
        batStat.balls += 1;
        batStat.runs += runs;
        if (isFour) batStat.fours += 1;
        if (isSix) batStat.sixes += 1;
      } else if (event.extras && (event.extras.type === 'wide' || event.extras.type === 'no_ball')) {
        if (runs > 0) batStat.runs += runs;
      }
      if (event.wicket && event.wicketType !== 'run_out') {
        batStat.out = true;
        batStat.dismissalType = event.wicketType || 'unknown';
        if (event.bowler) batStat.bowledBy = event.bowler;
      }
      batStat.strikeRate = parseFloat(((batStat.runs / (batStat.balls || 1)) * 100).toFixed(2));
    }

    // Update player bowling stats
    if (event.bowler) {
      let bowlStat = match.playerStats.bowling.find(
        b => b.playerName === event.bowler && b.team === bowlingTeam
      );
      if (!bowlStat) {
        match.playerStats.bowling.push({
          playerName: event.bowler,
          team: bowlingTeam,
          overs: 0, balls: 0, runs: 0, wickets: 0, economy: 0, wides: 0, noBalls: 0,
        });
        bowlStat = match.playerStats.bowling[match.playerStats.bowling.length - 1];
      }
      if (isLegalDelivery) {
        bowlStat.balls += 1;
      }
      const bowlerRuns = isByeLegBye ? runs : totalRuns;
      bowlStat.runs += bowlerRuns;
      if (event.wicket) bowlStat.wickets += 1;
      if (event.extras && event.extras.type === 'wide') bowlStat.wides += 1;
      if (event.extras && event.extras.type === 'no_ball') bowlStat.noBalls += 1;
      bowlStat.economy = parseFloat(((bowlStat.runs / (bowlStat.balls || 1)) * 6).toFixed(2));
    }

    // Update match level scores (teamAResult/teamBResult for backwards compat)
    const oversStr = `${Math.floor(score.balls / 6)}.${score.balls % 6}`;
    if (battingTeam === 'teamA') {
      match.teamAResult = { runs: score.runs, wickets: score.wickets, overs: oversStr };
    } else {
      match.teamBResult = { runs: score.runs, wickets: score.wickets, overs: oversStr };
    }

    await match.save();

    // Save ball to dedicated Ball collection for audit trail
    try {
      await Ball.create({
        matchId: match._id,
        innings: battingTeam === match.battingFirst ? 1 : 2,
        overNumber: event.over,
        ballNumber: event.ball,
        battingTeam,
        bowlingTeam,
        striker: event.batsman || '',
        nonStriker: '',
        bowler: event.bowler || '',
        runs,
        extraRuns: extrasRuns,
        extraType: event.extras?.type || null,
        isWicket: !!event.wicket,
        wicketType: event.wicketType || null,
        dismissedPlayer: event.wicket ? event.batsman || '' : '',
        newBatsman: event.newBatsman || '',
        fielder: event.fielder || '',
        commentary: event.description || '',
        isFour,
        isSix,
        scoredBy: userId,
      });
    } catch (ballErr) {
      console.warn('Ball audit log save skipped:', ballErr.message);
    }

    // Broadcast via socket
    try {
      const io = getIo();
      io.to(`match:${matchId}`).emit('ball-event', { event: ballEvent, match });
      io.to(`match:${matchId}`).emit('score-updated', { match });
    } catch (err) {
      console.warn('Socket broadcast skipped:', err.message);
    }

    return res.json({ success: true, match });

  } catch (err) {
    console.error('addBall error', err);
    return res.status(500).json({ message: err.message });
  }
};

exports.undoLastBall = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    if (match.events.length === 0) {
      return res.status(400).json({ message: 'No events to undo' });
    }

    const removed = match.events.pop();
    match.markModified('events');

    // Recalculate everything from scratch
    const battingFirst = match.battingFirst || 'teamA';
    const totalOvers = 20;
    const { computeMatchState } = require('../utils/scoreCalculator');
    const state = computeMatchState(match.events, battingFirst, totalOvers);

    match.score = state.score;
    match.playerStats = state.playerStats;
    match.currentOver = state.currentOver || [];
    match.currentOverNumber = state.currentOverNumber || 0;

    const teamAScore = state.score.teamA;
    const teamBScore = state.score.teamB;
    match.teamAResult = { runs: teamAScore.runs, wickets: teamAScore.wickets, overs: `${teamAScore.overs}.${teamAScore.balls % 6}` };
    match.teamBResult = { runs: teamBScore.runs, wickets: teamBScore.wickets, overs: `${teamBScore.overs}.${teamBScore.balls % 6}` };

    await match.save();

    // Also remove from Ball collection
    try {
      await Ball.findOneAndDelete({
        matchId: match._id,
        overNumber: removed.over,
        ballNumber: removed.ball,
      });
    } catch (e) {
      // non-critical
    }

    try {
      const io = getIo();
      io.to(`match:${match._id}`).emit('ball-event', { event: removed, match, undone: true });
      io.to(`match:${match._id}`).emit('score-updated', { match });
    } catch (e) {}

    return res.json({ success: true, match, message: 'Last ball undone and state recalculated.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getLiveScore = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('teamA', 'teamName teamLogo teamCode')
      .populate('teamB', 'teamName teamLogo teamCode')
      .populate('seasonNumber', 'seasonNumber');

    if (!match) return res.status(404).json({ message: 'Match not found' });

    // Compute advanced stats
    const battingFirst = match.battingFirst || 'teamA';
    const state = computeMatchState(match.events, battingFirst);

    return res.json({ success: true, match, computed: state });
  } catch (err) {
    console.error('getLiveScore error', err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getLiveMatches = async (req, res) => {
  try {
    const matches = await Match.find({ result: 'live' })
      .populate('teamA', 'teamName teamLogo teamCode')
      .populate('teamB', 'teamName teamLogo teamCode')
      .sort({ matchTime: -1 });

    return res.json({ success: true, matches });
  } catch (err) {
    console.error('getLiveMatches error', err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getRecentMatches = async (req, res) => {
  try {
    const matches = await Match.find({ result: 'completed' })
      .populate('teamA', 'teamName teamLogo teamCode')
      .populate('teamB', 'teamName teamLogo teamCode')
      .sort({ matchTime: -1 })
      .limit(20);

    return res.json({ success: true, matches });
  } catch (err) {
    console.error('getRecentMatches error', err);
    return res.status(500).json({ message: err.message });
  }
};
