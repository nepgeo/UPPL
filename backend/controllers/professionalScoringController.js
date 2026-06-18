const Match = require('../models/matchModel');
const PlayingXI = require('../models/PlayingXI');
const AuditLog = require('../models/AuditLog');
const Ball = require('../models/Ball');
const { getIo } = require('../socket');
const { computeMatchState } = require('../utils/scoreCalculator');

async function logAction(matchId, admin, action, oldData, newData, reason) {
  try {
    await AuditLog.create({
      matchId, action,
      adminName: admin?.name || 'unknown',
      adminId: admin?._id,
      oldData, newData, reason,
    });
  } catch (e) { /* non-critical */ }
}

// ===== PLAYING XI =====
exports.setPlayingXI = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { team, players } = req.body;
    if (!['teamA', 'teamB'].includes(team)) return res.status(400).json({ message: 'Invalid team' });
    if (!players || players.length < 11) return res.status(400).json({ message: 'Need at least 11 players' });

    let xi = await PlayingXI.findOne({ matchId, team });
    if (xi) {
      xi.players = players;
      await xi.save();
    } else {
      xi = await PlayingXI.create({ matchId, team, players });
    }

    // Update match batting order
    const match = await Match.findById(matchId);
    if (team === 'teamA') match.battingOrderA = players.map(p => p.playerName);
    else match.battingOrderB = players.map(p => p.playerName);
    await match.save();

    await logAction(matchId, req.user, 'set_playing_xi', {}, { team, count: players.length }, 'Playing XI set');
    res.json({ success: true, playingXI: xi });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPlayingXI = async (req, res) => {
  try {
    const xi = await PlayingXI.find({ matchId: req.params.matchId });
    res.json({ success: true, playingXI: xi });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== TOSS =====
exports.doMatchToss = async (req, res) => {
  try {
    const { tossWinner, tossDecision } = req.body;
    const match = await Match.findById(req.params.matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    match.tossWinner = tossWinner;
    match.tossDecision = tossDecision;
    // Determine batting/bowling first
    if (tossDecision === 'bat') {
      match.battingFirst = tossWinner;
    } else {
      match.battingFirst = tossWinner === 'teamA' ? 'teamB' : 'teamA';
    }
    await match.save();

    await logAction(req.params.matchId, req.user, 'toss', {}, { tossWinner, tossDecision }, 'Toss completed');
    res.json({ success: true, match });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== START INNINGS / SET OPENERS =====
exports.startInnings = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const { striker, nonStriker, bowler } = req.body;
    match.striker = striker;
    match.nonStriker = nonStriker;
    match.currentBowler = bowler;
    match.inningsStarted = true;
    match.currentOverNumber = 0;
    match.legalBallsInOver = 0;
    match.overCompleted = false;
    match.currentOverRuns = 0;
    match.currentOverExtras = false;
    match.freeHit = false;
    match.powerplayActive = true;
    match.result = 'live';
    await match.save();

    await logAction(req.params.matchId, req.user, 'start_innings', {}, { striker, nonStriker, bowler }, 'Innings started');
    try { getIo().to(`match:${match._id}`).emit('innings_started', { match }); } catch (e) {}
    res.json({ success: true, match });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== END INNINGS =====
exports.endInnings = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    if (match.currentInnings === 1) {
      match.firstInningsCompleted = true;
      match.currentInnings = 2;
      match.inningsStarted = false;
      match.striker = '';
      match.nonStriker = '';
      match.currentBowler = '';
      match.currentOverNumber = 0;
      match.legalBallsInOver = 0;
      match.overCompleted = false;
      match.currentOverRuns = 0;
      match.currentOverExtras = false;
      match.freeHit = false;
      match.powerplayActive = true;
    } else {
      match.result = 'completed';
    }
    await match.save();

    await logAction(req.params.matchId, req.user, 'end_innings', {}, { innings: match.currentInnings === 2 ? 1 : 2 }, 'Innings ended');
    try { getIo().to(`match:${match._id}`).emit('innings_ended', { match }); } catch (e) {}
    res.json({ success: true, match });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== SCORE BALL (with full cricket rules engine) =====
exports.scoreBall = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId).populate('teamA teamB');
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (!match.inningsStarted) return res.status(400).json({ message: 'Innings not started' });

    const { runs, extraType, extraRuns, isWicket, wicketType, dismissedPlayer, newBatsman, fielder, isDeadBall } = req.body;

    // --- Dead Ball: completely ignore ---
    if (isDeadBall) {
      return res.json({ success: true, match, overCompleted: false, deadBall: true });
    }

    const battingTeam = match.currentInnings === 1 ? match.battingFirst : (match.battingFirst === 'teamA' ? 'teamB' : 'teamA');
    const bowlingTeam = battingTeam === 'teamA' ? 'teamB' : 'teamA';
    const over = match.currentOverNumber || 0;
    const ball = (match.legalBallsInOver || 0) + 1;

    // --- Legal delivery check: exclude wide, no-ball AND penalty ---
    const isLegalDelivery = !extraType || (extraType !== 'wide' && extraType !== 'no_ball' && extraType !== 'penalty');
    const isByeLegBye = extraType === 'bye' || extraType === 'leg_bye';
    const totalRuns = (runs || 0) + (extraRuns || 0);

    // --- Free Hit: on no-ball, next ball is free hit ---
    const isFreeHitDelivery = match.freeHit === true;

    // --- No-ball + Caught = not out (free hit rule) ---
    const isWicketOverridden = isWicket && isFreeHitDelivery &&
      (wicketType === 'bowled' || wicketType === 'caught' || wicketType === 'lbw' || wicketType === 'hit_wicket' || wicketType === 'stumped');
    const actualWicket = !!isWicket && !isWicketOverridden;

    // Run out / obstructing / hit ball twice always out even on free hit
    const freeHitAllowedOutTypes = ['run_out', 'obstructing_field', 'hit_ball_twice', 'stumped'];
    const onFreeHitButLegalDismissal = isWicket && isFreeHitDelivery && freeHitAllowedOutTypes.includes(wicketType);

    const finalWicket = !isFreeHitDelivery ? !!isWicket : (onFreeHitButLegalDismissal || actualWicket);

    // --- 4s/6s detection ---
    const isFour = runs === 4 && (isLegalDelivery || extraType === 'no_ball') && !isByeLegBye;
    const isSix = runs === 6 && (isLegalDelivery || extraType === 'no_ball') && !isByeLegBye;

    const ballEvent = {
      over, ball, runs: runs || 0,
      extras: extraType ? { type: extraType, runs: extraRuns || 0 } : { type: null, runs: 0 },
      wicket: finalWicket, wicketType: wicketType || null,
      batsman: match.striker, bowler: match.currentBowler,
      fielder: fielder || '', battingTeam,
      description: '',
      isFour, isSix,
      freeHit: isFreeHitDelivery,
      isDeadBall: false,
    };

    // Auto commentary
    if (isFreeHitDelivery && !finalWicket) {
      ballEvent.description = `Free Hit, ${match.currentBowler} to ${match.striker}`;
      if (isWicketOverridden) {
        ballEvent.description = `Free Hit — ${wicketType} not out! ${match.currentBowler} to ${match.striker}`;
      }
    }
    if (finalWicket) {
      ballEvent.description = `${match.striker} ${wicketType?.replace(/_/g, ' ')} b ${match.currentBowler}${fielder ? ` (c ${fielder})` : ''}`;
    } else if (extraType) {
      const label = extraType.replace(/_/g, ' ');
      ballEvent.description = runs > 0 ? `${label}, ${runs} run${runs > 1 ? 's' : ''}` : label;
    } else if (runs === 0) ballEvent.description = `No run, ${match.currentBowler} to ${match.striker}`;
    else if (runs === 4) ballEvent.description = `FOUR! ${match.striker} drives through covers`;
    else if (runs === 6) ballEvent.description = `SIX! ${match.striker} sends it over the ropes`;
    else ballEvent.description = `${runs} run${runs > 1 ? 's' : ''} to ${match.striker}`;

    match.events.push(ballEvent);

    // --- Update score ---
    const score = match.score[battingTeam];
    if (!score) match.score[battingTeam] = { battingTeam, runs: 0, wickets: 0, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 };

    score.runs += totalRuns;
    if (isLegalDelivery) score.balls += 1;
    if (finalWicket) score.wickets += 1;
    if (extraRuns) score.extras += extraRuns;
    if (isFour) score.fours += 1;
    if (isSix) score.sixes += 1;
    score.runRate = parseFloat(((score.runs / (score.balls || 1)) * 6).toFixed(2));

    // --- Over tracking + maiden over tracking ---
    if (match.currentOver.length === 0) {
      match.currentOverRuns = 0;
      match.currentOverExtras = false;
    }

    const hasWideOrNoBall = extraType === 'wide' || extraType === 'no_ball';
    // Only runs charged to bowler count for maiden: bat runs, wides, no-balls (NOT byes/leg-byes/penalty)
    const overBowlerRuns = isByeLegBye ? (runs || 0) : totalRuns;
    match.currentOverRuns += overBowlerRuns;
    if (hasWideOrNoBall) match.currentOverExtras = true;

    if (isLegalDelivery) {
      match.legalBallsInOver += 1;
      match.overCompleted = match.legalBallsInOver >= 6;
    }

    // --- Current over display ---
    const lastEventOver = match.currentOver?.[match.currentOver.length - 1]?.over;
    if (lastEventOver !== undefined && lastEventOver !== over) {
      match.currentOver = [];
    }
    match.currentOver.push(ballEvent);

    // --- Player batting stats ---
    let batStriker = match.playerStats.batting.find(b => b.playerName === match.striker && b.team === battingTeam);
    if (!batStriker) {
      match.playerStats.batting.push({ playerName: match.striker, team: battingTeam, runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0, out: false, dismissalType: '', bowledBy: '' });
      batStriker = match.playerStats.batting[match.playerStats.batting.length - 1];
    }
    if (isLegalDelivery) {
      batStriker.balls += 1;
      if (!isByeLegBye) batStriker.runs += runs || 0;
      if (isFour) batStriker.fours += 1;
      if (isSix) batStriker.sixes += 1;
    } else if (extraType === 'no_ball') {
      if (runs > 0) batStriker.runs += runs;
    }

    // --- Dismissal: only specific wicket types mark batsman out ---
    const bowlCreditedTypes = ['bowled', 'caught', 'lbw', 'stumped', 'hit_wicket'];
    const noBowlerWicketTypes = ['run_out', 'retired_out', 'timed_out', 'obstructing_field', 'hit_ball_twice'];
    if (finalWicket && bowlCreditedTypes.includes(wicketType)) {
      batStriker.out = true;
      batStriker.dismissalType = wicketType || 'unknown';
      batStriker.bowledBy = match.currentBowler;
    } else if (finalWicket && noBowlerWicketTypes.includes(wicketType)) {
      batStriker.out = true;
      batStriker.dismissalType = wicketType || 'unknown';
      batStriker.bowledBy = '';
    }
    batStriker.strikeRate = parseFloat(((batStriker.runs / (batStriker.balls || 1)) * 100).toFixed(2));

    // --- Dismissed players tracking ---
    if (finalWicket) {
      if (!match.dismissedPlayers.includes(match.striker)) {
        match.dismissedPlayers.push(match.striker);
      }
    }

    // --- Auto-advance batting order for new batsman ---
    if (finalWicket) {
      const idxKey = battingTeam === 'teamA' ? 'nextBatAIndex' : 'nextBatBIndex';
      const order = battingTeam === 'teamA' ? match.battingOrderA : match.battingOrderB;
      let idx = match[idxKey] ?? 0;
      while (idx < (order?.length || 0) && (
        match.dismissedPlayers.includes(order[idx]) ||
        order[idx] === match.striker ||
        order[idx] === match.nonStriker
      )) {
        idx++;
      }
      if (idx < (order?.length || 0)) {
        match.striker = order[idx];
        match[idxKey] = idx + 1;
      } else {
        match.striker = '';
      }
    }

    // --- Player bowling stats ---
    let bowlStat = match.playerStats.bowling.find(b => b.playerName === match.currentBowler && b.team === bowlingTeam);
    if (!bowlStat) {
      match.playerStats.bowling.push({ playerName: match.currentBowler, team: bowlingTeam, overs: 0, balls: 0, runs: 0, wickets: 0, economy: 0, wides: 0, noBalls: 0, maidens: 0, currentOverRuns: 0 });
      bowlStat = match.playerStats.bowling[match.playerStats.bowling.length - 1];
    }
    if (isLegalDelivery) bowlStat.balls += 1;

    const bowlerRuns = isByeLegBye ? (runs || 0) : totalRuns;
    bowlStat.runs += bowlerRuns;

    // --- Bowler wicket credit: only for specific wicket types ---
    if (finalWicket && bowlCreditedTypes.includes(wicketType)) {
      bowlStat.wickets += 1;
    }
    if (extraType === 'wide') bowlStat.wides += 1;
    if (extraType === 'no_ball') bowlStat.noBalls += 1;
    bowlStat.economy = parseFloat(((bowlStat.runs / (bowlStat.balls || 1)) * 6).toFixed(2));

    // --- Bowler over limit check (max 4 in T20) ---
    if (bowlStat.balls >= 24 && isLegalDelivery) {
      // Don't block — just flag; UI can warn
    }

    // --- Maiden over: tracked when over completes ---
    // At over completion, if 0 runs conceded and no extras, mark maiden
    // (Handled in over completion block below)

    // --- Powerplay tracking ---
    match.powerplayActive = match.currentOverNumber <= (match.powerplayOvers || 6);

    // --- Update teamAResult/teamBResult ---
    const oversStr = `${Math.floor(score.balls / 6)}.${score.balls % 6}`;
    if (battingTeam === 'teamA') match.teamAResult = { runs: score.runs, wickets: score.wickets, overs: oversStr };
    else match.teamBResult = { runs: score.runs, wickets: score.wickets, overs: oversStr };

    // --- Net run rate ---
    const otherScore = match.score[bowlingTeam];
    if (otherScore && otherScore.balls > 0) {
      if (battingTeam === 'teamA') {
        match.score.teamA.runRate = parseFloat(((match.score.teamA.runs / (match.score.teamA.balls || 1)) * 6).toFixed(2));
      } else {
        match.score.teamB.runRate = parseFloat(((match.score.teamB.runs / (match.score.teamB.balls || 1)) * 6).toFixed(2));
      }
    }

    // --- Automatic strike rotation ---
    // Odd runs from bat (legal delivery) OR total odd runs on wide/no-ball/byes
    const bypassSwap = finalWicket && !onFreeHitButLegalDismissal;
    const oddRunsFromBat = runs === 1 || runs === 3 || runs === 5;
    const oddRunsTotal = totalRuns % 2 === 1;
    const shouldSwapStriker = !bypassSwap && (
      (isLegalDelivery && oddRunsFromBat) ||
      (!isLegalDelivery && oddRunsTotal) ||
      (isByeLegBye && oddRunsTotal)
    );

    if (shouldSwapStriker) {
      [match.striker, match.nonStriker] = [match.nonStriker, match.striker];
    }

    // --- Over completion ---
    if (match.overCompleted) {
      // --- Maiden over check (0 runs charged to bowler, no wides/no-balls) ---
      const overBowlers = match.playerStats.bowling.filter(b => b.playerName === match.currentBowler);
      if (overBowlers.length > 0) {
        const ob = overBowlers[0];
        const isMaiden = match.currentOverRuns === 0 && !match.currentOverExtras;
        if (isMaiden) {
          ob.maidens = (ob.maidens || 0) + 1;
        }
      }

      [match.striker, match.nonStriker] = [match.nonStriker, match.striker];
      match.legalBallsInOver = 0;
      match.currentOverNumber += 1;
      match.currentOver = [];
      match.currentOverRuns = 0;
      match.currentOverExtras = false;
    }

    // --- Set free hit for next ball if this ball was a no-ball ---
    match.freeHit = extraType === 'no_ball';

    await match.save();

    // --- Save audit trail ball ---
    try {
      await Ball.create({
        matchId: match._id, innings: match.currentInnings,
        overNumber: over, ballNumber: ball,
        battingTeam, bowlingTeam,
        striker: match.striker, nonStriker: match.nonStriker,
        bowler: match.currentBowler,
        runs: runs || 0, extraRuns: extraRuns || 0, extraType: extraType || null,
        isWicket: finalWicket, wicketType: wicketType || null,
        dismissedPlayer: finalWicket ? match.striker : '',
        newBatsman: newBatsman || '', fielder: fielder || '',
        commentary: ballEvent.description,
        isFour, isSix, freeHit: isFreeHitDelivery, isDeadBall: false,
        scoredBy: req.user?._id,
      });
    } catch (be) { /* non-critical */ }

    await logAction(match._id, req.user, 'ball_added', {}, ballEvent, '');

    // --- Socket broadcast ---
    try {
      const io = getIo();
      io.to(`match:${match._id}`).emit('ball_added', { event: ballEvent, match });
      io.to(`match:${match._id}`).emit('score_updated', { match });
      if (finalWicket) io.to(`match:${match._id}`).emit('wicket_fallen', { match, batsman: match.striker, wicketType });
      if (match.overCompleted) io.to(`match:${match._id}`).emit('over_completed', { match, over, balls: match.currentOver });
    } catch (e) {}

    res.json({ success: true, match, overCompleted: match.overCompleted, freeHit: match.freeHit });
  } catch (err) {
    console.error('scoreBall error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ===== SET NEXT BOWLER =====
exports.setBowler = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    match.currentBowler = req.body.bowler;
    if (req.body.bowlerQueue) match.bowlerQueue = req.body.bowlerQueue;
    await match.save();
    res.json({ success: true, match });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== SET NEW BATSMAN (after wicket or over change) =====
exports.setBatsman = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const { role, playerName } = req.body;
    if (role === 'striker') match.striker = playerName;
    else if (role === 'nonStriker') match.nonStriker = playerName;

    await match.save();
    res.json({ success: true, match });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== UNDO LAST BALL =====
exports.undoBall = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.events.length === 0) return res.status(400).json({ message: 'No events to undo' });

    const removed = match.events.pop();
    match.markModified('events');

    // Recalculate score/playerStats from remaining events
    const battingFirst = match.battingFirst || 'teamA';
    const state = computeMatchState(match.events, battingFirst);

    match.score = state.score;
    match.playerStats = state.playerStats;

    const t1 = state.score.teamA;
    const t2 = state.score.teamB;
    match.teamAResult = { runs: t1.runs, wickets: t1.wickets, overs: `${t1.overs}.${t1.balls % 6}` };
    match.teamBResult = { runs: t2.runs, wickets: t2.wickets, overs: `${t2.overs}.${t2.balls % 6}` };

    // Calculate current over from last remaining event
    if (match.events.length === 0) {
      match.currentOverNumber = 0;
      match.legalBallsInOver = 0;
      match.overCompleted = false;
      match.currentOver = [];
      match.currentOverRuns = 0;
      match.currentOverExtras = false;
      match.freeHit = false;
    } else {
      const lastEv = match.events[match.events.length - 1];
      const lastOver = lastEv.over || 1;
      // If last event's over was completed, we're now in the next over
      const lastOverLegal = match.events.filter(e =>
        e.over === lastOver &&
        (!e.extras || (e.extras.type !== 'wide' && e.extras.type !== 'no_ball' && e.extras.type !== 'penalty'))
      );
      const allLegalInLastOver = match.events.filter(e =>
        (!e.extras || (e.extras.type !== 'wide' && e.extras.type !== 'no_ball' && e.extras.type !== 'penalty'))
      );
      const overGroups = {};
      allLegalInLastOver.forEach(e => {
        if (!overGroups[e.over]) overGroups[e.over] = [];
        overGroups[e.over].push(e);
      });
      // Find the highest over with 6 legal balls — that's completed
      const completedOvers = Object.keys(overGroups)
        .map(Number).filter(ov => overGroups[ov].length >= 6)
        .sort((a, b) => b - a);
      const currentOverNum = completedOvers.length > 0 ? completedOvers[0] + 1 : 0;

      match.currentOverNumber = currentOverNum;
      const currentOverEvents = match.events.filter(e => e.over === currentOverNum);
      const legalInCurrent = currentOverEvents.filter(e =>
        !e.extras || (e.extras.type !== 'wide' && e.extras.type !== 'no_ball' && e.extras.type !== 'penalty')
      );
      match.legalBallsInOver = legalInCurrent.length;
      match.overCompleted = match.legalBallsInOver >= 6;
      match.currentOver = currentOverEvents;

      // Recalculate currentOverRuns for maiden
      match.currentOverRuns = 0;
      match.currentOverExtras = false;
      currentOverEvents.forEach(e => {
        const er = (e.extras && e.extras.runs) || 0;
        const erType = e.extras && e.extras.type;
        const br = e.runs || 0;
        const isWideNB = erType === 'wide' || erType === 'no_ball';
        if (isWideNB) match.currentOverRuns += br + er;
        else if (erType === 'bye' || erType === 'leg_bye') match.currentOverRuns += 0;
        else match.currentOverRuns += br;
        if (isWideNB) match.currentOverExtras = true;
      });

      // Recalculate freeHit from last event
      match.freeHit = lastEv.extras && lastEv.extras.type === 'no_ball';
    }

    // Recalculate dismissed players from events
    match.dismissedPlayers = match.events.filter(e => e.wicket).map(e => e.batsman).filter(Boolean);

    await match.save();

    try { await Ball.findOneAndDelete({ matchId: match._id, overNumber: removed.over, ballNumber: removed.ball }); } catch (e) {}
    await logAction(match._id, req.user, 'undo_ball', { removed }, {}, 'Ball undone');

    try {
      const io = getIo();
      io.to(`match:${match._id}`).emit('ball_removed', { match });
      io.to(`match:${match._id}`).emit('score_updated', { match });
    } catch (e) {}

    res.json({ success: true, match, message: 'Last ball undone. State recalculated.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== FINISH OVER (force-complete without recording a ball) =====
exports.finishOver = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (!match.inningsStarted) return res.status(400).json({ message: 'Innings not started' });
    if (!match.legalBallsInOver || match.legalBallsInOver === 0)
      return res.status(400).json({ message: 'No balls bowled in current over to finish' });

    // Maiden check on force-finish
    const overBowlers = match.playerStats.bowling.filter(b => b.playerName === match.currentBowler);
    if (overBowlers.length > 0) {
      const ob = overBowlers[0];
      const isMaiden = match.currentOverRuns === 0 && !match.currentOverExtras;
      if (isMaiden) {
        ob.maidens = (ob.maidens || 0) + 1;
      }
    }

    [match.striker, match.nonStriker] = [match.nonStriker, match.striker];
    match.legalBallsInOver = 0;
    match.currentOverNumber += 1;
    match.currentOver = [];
    match.currentOverRuns = 0;
    match.currentOverExtras = false;
    match.overCompleted = false;

    await match.save();

    await logAction(match._id, req.user, 'over_finished', {}, {}, 'Over force-finished');

    try {
      const io = getIo();
      io.to(`match:${match._id}`).emit('over_completed', { match, over: match.currentOverNumber - 1 });
      io.to(`match:${match._id}`).emit('score_updated', { match });
    } catch (e) {}

    const state = computeMatchState(match.events, match.battingFirst);
    res.json({ success: true, match, computed: state });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== GET MATCH WITH FULL STATE =====
exports.getScoringState = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate('teamA', 'teamName teamLogo teamCode')
      .populate('teamB', 'teamName teamLogo teamCode');
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const xi = await PlayingXI.find({ matchId: match._id });
    const battingFirst = match.battingFirst || 'teamA';
    const state = computeMatchState(match.events, battingFirst);

    res.json({ success: true, match, playingXI: xi, computed: state });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
