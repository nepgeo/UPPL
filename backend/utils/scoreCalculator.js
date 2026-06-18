/**
 * scoreCalculator.js
 * Pure functions to compute match stats from an array of ball events.
 */

function calcRunRate(runs, balls) {
  if (balls === 0) return 0;
  return parseFloat(((runs / balls) * 6).toFixed(2));
}

function calcStrikeRate(runs, balls) {
  if (balls === 0) return 0;
  return parseFloat(((runs / balls) * 100).toFixed(2));
}

function calcEconomy(runs, balls) {
  if (balls === 0) return 0;
  return parseFloat(((runs / balls) * 6).toFixed(2));
}

/**
 * Compute full match state from an array of events for a given batting team.
 */
function computeInnings(events, battingTeam, totalOvers = 20) {
  const teamEvents = events.filter(e => e.battingTeam === battingTeam);

  let runs = 0, balls = 0, wickets = 0, extras = 0, fours = 0, sixes = 0;
  const battingStats = {};
  const bowlingStats = {};
  const fallOfWickets = [];
  const overBalls = {};
  const commentary = [];

  const bowlingTeam = battingTeam === 'teamA' ? 'teamB' : 'teamA';

  for (const e of teamEvents) {
    const r = Number(e.runs || 0);
    const er = Number((e.extras && e.extras.runs) || 0);
    const total = r + er;
    const isLegal = !e.extras || (e.extras.type !== 'wide' && e.extras.type !== 'no_ball');
    const isByeLegBye = e.extras && (e.extras.type === 'bye' || e.extras.type === 'leg_bye');

    runs += total;
    extras += er;
    if (isLegal) {
      balls += 1;
    }
    if (e.wicket) wickets += 1;
    if (e.isFour && isLegal) fours += 1;
    if (e.isSix && isLegal) sixes += 1;

    // Fall of wickets
    if (e.wicket && e.batsman) {
      fallOfWickets.push({
        wicketNumber: fallOfWickets.length + 1,
        playerName: e.batsman,
        runs: runs,
        over: e.over,
        ball: e.ball,
        dismissedBy: e.bowler,
        dismissedType: e.wicketType,
      });
    }

    // Batting stats
    const batsman = e.batsman || '';
    if (batsman) {
      if (!battingStats[batsman]) {
        battingStats[batsman] = { playerName: batsman, team: battingTeam, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissalType: '', bowledBy: '' };
      }
      const bs = battingStats[batsman];
      if (isLegal) {
        bs.balls += 1;
        bs.runs += r;
        if (e.isFour) bs.fours += 1;
        if (e.isSix) bs.sixes += 1;
      } else if (e.extras && (e.extras.type === 'wide' || e.extras.type === 'no_ball')) {
        if (r > 0) bs.runs += r;
      }
      if (e.wicket && e.wicketType !== 'run_out') {
        bs.out = true;
        bs.dismissalType = e.wicketType || 'unknown';
        if (e.bowler) bs.bowledBy = e.bowler;
      }
      bs.strikeRate = calcStrikeRate(bs.runs, bs.balls);
    }

    // Bowling stats
    const bowler = e.bowler || '';
    if (bowler) {
      if (!bowlingStats[bowler]) {
        bowlingStats[bowler] = { playerName: bowler, team: bowlingTeam, overs: 0, balls: 0, runs: 0, wickets: 0, economy: 0, wides: 0, noBalls: 0, maidens: 0 };
      }
      const bwl = bowlingStats[bowler];
      if (isLegal) {
        bwl.balls += 1;
      }
      const bowlerRuns = isByeLegBye ? r : total;
      bwl.runs += bowlerRuns;
      if (e.wicket) bwl.wickets += 1;
      if (e.extras && e.extras.type === 'wide') bwl.wides += 1;
      if (e.extras && e.extras.type === 'no_ball') bwl.noBalls += 1;
      bwl.economy = calcEconomy(bwl.runs, bwl.balls);
    }



    // Over balls tracking (for last 6 balls and over summaries)
    const key = `${e.over}`;
    if (!overBalls[key]) overBalls[key] = [];
    overBalls[key].push(e);

    // Commentary
    commentary.push(e);
  }

  // Compute maidens per bowler by grouping events by over
  const overGroups = {};
  teamEvents.forEach(e => {
    const ov = e.over;
    if (ov === undefined) return;
    if (!overGroups[ov]) overGroups[ov] = { events: [], bowler: e.bowler || '' };
    overGroups[ov].events.push(e);
    if (e.bowler) overGroups[ov].bowler = e.bowler;
  });
  Object.values(overGroups).forEach(og => {
    const legalEvs = og.events.filter(e => !e.extras || (e.extras.type !== 'wide' && e.extras.type !== 'no_ball'));
    if (legalEvs.length !== 6) return;
    let bowlerRuns = 0;
    let hasWideOrNB = false;
    og.events.forEach(e => {
      const er = (e.extras && e.extras.runs) || 0;
      const erType = e.extras && e.extras.type;
      const isByeLegBye = erType === 'bye' || erType === 'leg_bye';
      const isWideNB = erType === 'wide' || erType === 'no_ball';
      if (isWideNB) hasWideOrNB = true;
      const br = isByeLegBye ? 0 : ((e.runs || 0) + (isWideNB ? er : 0));
      bowlerRuns += br;
    });
    if (bowlerRuns === 0 && !hasWideOrNB && og.bowler && bowlingStats[og.bowler]) {
      bowlingStats[og.bowler].maidens = (bowlingStats[og.bowler].maidens || 0) + 1;
    }
  });

  // Compute overs
  const completedOvers = Math.floor(balls / 6);
  const currentOverBalls = balls % 6;
  const oversStr = `${completedOvers}.${currentOverBalls}`;

  // Batting array sorted by runs desc
  const battingArray = Object.values(battingStats).sort((a, b) => b.runs - a.runs);
  const bowlingArray = Object.values(bowlingStats).sort((a, b) => b.wickets - a.wickets || a.runs - b.runs);

  // Last 6 legal balls
  const legalEvents = teamEvents.filter(e => !e.extras || (e.extras.type !== 'wide' && e.extras.type !== 'no_ball'));
  const last6Balls = legalEvents.slice(-6).map(e => ({
    display: e.wicket ? 'W' : e.runs === 6 ? '6' : e.runs === 4 ? '4' : String(e.runs),
    runs: e.runs,
    isFour: e.isFour,
    isSix: e.isSix,
    wicket: e.wicket,
  }));

  // Partnership
  const notOutBatsmen = battingArray.filter(b => !b.out);
  let partnership = { runs: 0, balls: 0 };
  if (notOutBatsmen.length >= 2) {
    const p1 = notOutBatsmen[0];
    const p2 = notOutBatsmen[1];
    partnership = {
      batsman1: p1.playerName,
      runs1: p1.runs,
      balls1: p1.balls,
      batsman2: p2.playerName,
      runs2: p2.runs,
      balls2: p2.balls,
      runs: p1.runs + p2.runs,
      balls: p1.balls + p2.balls,
    };
  } else if (notOutBatsmen.length === 1) {
    partnership = {
      batsman1: notOutBatsmen[0].playerName,
      runs1: notOutBatsmen[0].runs,
      balls1: notOutBatsmen[0].balls,
      batsman2: '',
      runs2: 0,
      balls2: 0,
      runs: notOutBatsmen[0].runs,
      balls: notOutBatsmen[0].balls,
    };
  }

  return {
    runs,
    wickets,
    balls,
    overs: completedOvers,
    oversStr,
    extras,
    fours,
    sixes,
    runRate: calcRunRate(runs, balls),
    batting: battingArray,
    bowling: bowlingArray.map(b => ({ ...b, overs: Math.floor(b.balls / 6), ballsRemainder: b.balls % 6 })),
    fallOfWickets,
    partnership,
    last6Balls,
    commentary,
    overBalls: Object.values(overBalls),
  };
}

/**
 * Compute full match state for both innings.
 */
function computeMatchState(events, battingFirst, totalOvers = 20) {
  const firstInningsBatting = battingFirst || 'teamA';
  const secondInningsBatting = firstInningsBatting === 'teamA' ? 'teamB' : 'teamA';

  const innings1 = computeInnings(events, firstInningsBatting, totalOvers);
  const innings2 = computeInnings(events, secondInningsBatting, totalOvers);

  const target = innings1.runs + 1;
  const reqRunRate = innings2.balls > 0
    ? calcRunRate(target - innings2.runs, totalOvers * 6 - innings2.balls)
    : 0;

  return {
    score: {
      [firstInningsBatting]: {
        runs: innings1.runs,
        wickets: innings1.wickets,
        balls: innings1.balls,
        overs: innings1.overs,
        extras: innings1.extras,
        fours: innings1.fours,
        sixes: innings1.sixes,
        runRate: innings1.runRate,
      },
      [secondInningsBatting]: {
        runs: innings2.runs,
        wickets: innings2.wickets,
        balls: innings2.balls,
        overs: innings2.overs,
        extras: innings2.extras,
        fours: innings2.fours,
        sixes: innings2.sixes,
        runRate: innings2.runRate,
      },
    },
    battingFirst,
    playerStats: {
      batting: [...innings1.batting, ...innings2.batting],
      bowling: [...innings1.bowling, ...innings2.bowling],
    },
    fallOfWickets: {
      [firstInningsBatting]: innings1.fallOfWickets,
      [secondInningsBatting]: innings2.fallOfWickets,
    },
    partnerships: {
      [firstInningsBatting]: innings1.partnership,
      [secondInningsBatting]: innings2.partnership,
    },
    last6Balls: innings2.last6Balls.length > 0 ? innings2.last6Balls : innings1.last6Balls,
    currentOver: innings2.overBalls[innings2.overBalls.length - 1] || innings1.overBalls[innings1.overBalls.length - 1] || [],
    currentOverNumber: innings2.overs > 0 ? innings2.overs : innings1.overs,
    target,
    requiredRunRate: parseFloat(reqRunRate.toFixed(2)),
    commentary: innings2.commentary.length > 0 ? innings2.commentary : innings1.commentary,
  };
}

module.exports = { computeInnings, computeMatchState, calcRunRate, calcStrikeRate, calcEconomy };
