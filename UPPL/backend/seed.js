const mongoose = require('mongoose');
require('dotenv').config();

const seasonModel = require('./models/seasonModel');
const teamModel = require('./models/teamModel');
const groupScheduleModel = require('./models/groupScheduleModel');
const matchModel = require('./models/matchModel');
const PlayingXI = require('./models/PlayingXI');

function r(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function pick(arr) { return arr[r(0, arr.length - 1)]; }

const PLAYER_NAMES = [
  'Rajesh Hamal', 'Bhuwan Kc', 'Shree Krishna', 'Nabin Singh', 'Anil Thapa',
  'Sagar Rai', 'Ramesh Budha', 'Prakash Thapa', 'Dipak Bohara', 'Kiran Saud',
  'Mohan Chand', 'Sushil Dhami', 'Bimal Aire', 'Tika Ram', 'Yogesh Deuba',
  'Narendra Singh', 'Laxman Mahara', 'Ganesh Oli', 'Rabi Bhandari', 'Suresh Nagarkoti',
  'Mahesh Rana', 'Kedar Bhatta', 'Pradeep Karki', 'Hemant Bist', 'Basanta Saud',
  'Arjun Saud', 'Lalit Bohara', 'Dinesh Dhami', 'Santosh Rawal', 'Rohit Thagunna',
  'Abhishek Chand', 'Saurav Chand', 'Pankaj Pujara', 'Nitesh Karki', 'Rajan Pela',
  'Kamal Aire', 'Deepak Deuba', 'Gagan Joshi', 'Bijay Singh', 'Ashok Karki'
];

const EXTRAS = ['wide', 'no_ball', 'bye', 'leg_bye'];
const WICKET_TYPES = ['bowled', 'caught', 'lbw', 'run_out', 'stumped'];

function getProfileImageUrl(teamIndex, playerIndex) {
  const id = `seed-player-${teamIndex}-${playerIndex}`;
  return { url: `https://res.cloudinary.com/dv0emra21/image/upload/v1760115617/teams/logos/jadnllb7mctaupsl0qjf.jpg`, public_id: id };
}

function makePaymentReceipt(teamIndex) {
  return { url: `https://res.cloudinary.com/dv0emra21/image/upload/v1759821733/teams/paymentReceipts/yxwjiluvzn3w250nmp8f.jpg`, public_id: `receipt-${teamIndex}` };
}

const TEAM_DATA = [
  { name: 'UPPL Eagles', code: 'EGLE', cap: 'Rajesh Hamal', group: 'A' },
  { name: 'UPPL Hawks', code: 'HAWK', cap: 'Bhuwan Kc', group: 'A' },
  { name: 'UPPL Titans', code: 'TITN', cap: 'Shree Krishna', group: 'B' },
  { name: 'UPPL Warriors', code: 'WARR', cap: 'Nabin Singh', group: 'B' },
  { name: 'UPPL Strikers', code: 'STRK', cap: 'Sagar Rai', group: 'C' },
  { name: 'UPPL Chargers', code: 'CHRG', cap: 'Ramesh Budha', group: 'C' },
  { name: 'UPPL Royals', code: 'ROYL', cap: 'Prakash Thapa', group: 'D' },
  { name: 'UPPL Kings', code: 'KING', cap: 'Kiran Saud', group: 'D' },
];

function generateBallEvents(oversCount) {
  const events = [];
  let batsman1 = 'Rajesh Hamal';
  let batsman2 = 'Bhuwan Kc';
  let bowler = 'Nabin Singh';
  let alternate = 0;

  for (let o = 0; o < oversCount; o++) {
    for (let b = 0; b < 6; b++) {
      const isWicket = Math.random() < 0.12;
      const extrasRoll = Math.random();
      let extras = null;
      if (extrasRoll < 0.08) {
        extras = { type: 'wide', runs: r(0, 1) };
      } else if (extrasRoll < 0.14) {
        extras = { type: 'no_ball', runs: r(0, 2) };
      } else if (extrasRoll < 0.18) {
        extras = { type: 'bye', runs: r(1, 2) };
      } else if (extrasRoll < 0.21) {
        extras = { type: 'leg_bye', runs: r(1, 2) };
      }

      const runs = isWicket ? 0 : pick([0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 4, 4, 6]);
      const totalRuns = runs + (extras?.runs || 0);

      const event = {
        over: o,
        ball: b + 1,
        runs,
        extras,
        wicket: isWicket,
        wicketType: isWicket ? pick(WICKET_TYPES) : null,
        batsman: alternate % 2 === 0 ? batsman1 : batsman2,
        bowler,
        fielder: isWicket ? pick(PLAYER_NAMES.slice(0, 10)) : '',
        battingTeam: 'teamA',
        description: isWicket ? 'Wicket!' : runs === 0 ? 'Dot ball' : runs === 4 ? 'FOUR!' : runs === 6 ? 'SIX!' : `${runs} runs`,
        isFour: runs === 4 && !extras,
        isSix: runs === 6 && !extras,
      };
      events.push(event);

      // Switch batsman on odd runs
      if (totalRuns % 2 === 1) alternate++;
    }
    // Switch bowler each over
    bowler = pick(PLAYER_NAMES.slice(2, 10));
  }
  return events;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Clean up any existing season 100 data
  const existingSeason = await seasonModel.findOne({ seasonNumber: 100 });
  if (existingSeason) {
    console.log('Removing existing season 100 data...');
    await matchModel.deleteMany({ seasonNumber: existingSeason._id });
    await teamModel.deleteMany({ seasonNumber: existingSeason._id });
    await groupScheduleModel.deleteMany({ seasonNumber: existingSeason._id });
    await seasonModel.findByIdAndDelete(existingSeason._id);
    console.log('Cleaned up');
  }

  // 1. Create season
  const season = await seasonModel.create({
    seasonNumber: 100,
    entryDeadline: new Date('2026-12-31'),
    isCurrent: true,
  });
  console.log('Created season 100:', season._id);

  // 2. Create teams with players
  const adminId = (await mongoose.connection.db.collection('users').findOne({ role: 'admin' }))?._id;
  if (!adminId) {
    console.error('No admin user found! Run with existing DB that has an admin.');
    process.exit(1);
  }

  const teams = [];
  for (let i = 0; i < TEAM_DATA.length; i++) {
    const td = TEAM_DATA[i];
    const players = [];
    for (let p = 0; p < 15; p++) {
      players.push({
        user: null,
        status: 'not_registered',
        position: p < 6 ? 'batsman' : p < 11 ? 'bowler' : 'all-rounder',
        jerseyNumber: p + 1,
        code: null,
        name: PLAYER_NAMES[i * 5 + p] || PLAYER_NAMES[p % PLAYER_NAMES.length],
      });
    }

    const team = await teamModel.create({
      teamName: td.name,
      teamLogo: { url: `https://res.cloudinary.com/dv0emra21/image/upload/v1760115617/teams/logos/jadnllb7mctaupsl0qjf.jpg`, public_id: `seed-team-${i}` },
      captainName: td.cap,
      coachName: '',
      managerName: '',
      contactNumber: '9800000000',
      seasonNumber: season._id,
      groupName: td.group,
      players,
      createdBy: adminId,
      paymentReceipt: makePaymentReceipt(i),
      status: 'approved',
      teamCode: td.code,
    });
    teams.push(team);
    console.log('Created team:', td.name, team._id);
  }

  // 3. Create group schedule
  const groups = ['A', 'B', 'C', 'D'].map(g => {
    const groupTeams = teams.filter(t => t.groupName === g);
    return {
      groupName: g,
      teams: groupTeams.map(t => ({
        team: t._id,
        teamName: t.teamName,
        teamCode: t.teamCode,
      })),
    };
  });

  await groupScheduleModel.create({
    seasonNumber: season._id,
    groups,
    generatedAt: new Date(),
  });
  console.log('Created group schedule');

  // 4. Create matches
  const now = new Date();

  // League matches (each group: team1 vs team2)
  const leagueMatches = [];
  for (const g of groups) {
    if (g.teams.length === 2) {
      leagueMatches.push({ teamA: g.teams[0].team, teamB: g.teams[1].team, group: g.groupName });
    }
  }

  const matchDays = [1, 2, 3, 4].map(d => new Date(now.getTime() + d * 86400000));

  for (let i = 0; i < leagueMatches.length; i++) {
    const lm = leagueMatches[i];
    const isCompleted = i < 2;
    const isLive = i === 2;

    const matchObj = {
      seasonNumber: season._id,
      stage: 'league',
      matchTime: matchDays[i],
      venue: 'UPPL Cricket Ground',
      teamA: lm.teamA,
      teamB: lm.teamB,
      result: isCompleted ? 'completed' : isLive ? 'live' : 'upcoming',
      score: {
        teamA: { battingTeam: 'teamA', runs: 0, wickets: 0, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 },
        teamB: { battingTeam: 'teamB', runs: 0, wickets: 0, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 },
      },
      events: [],
      currentOver: [],
      currentOverNumber: 0,
      battingFirst: 'teamA',
      playerStats: { batting: [], bowling: [] },
    };

    if (isCompleted) {
      const events = generateBallEvents(10);
      matchObj.events = events;
      matchObj.currentOver = events.slice(-6);
      matchObj.currentOverNumber = 10;

      // Compute stats
      const teamARuns = events.filter(e => e.battingTeam === 'teamA').reduce((s, e) => s + e.runs + (e.extras?.runs || 0), 0);
      const teamAWickets = events.filter(e => e.battingTeam === 'teamA' && e.wicket).length;
      const teamBRuns = 0;
      const teamBWickets = 0;

      matchObj.score.teamA = { battingTeam: 'teamA', runs: teamARuns, wickets: teamAWickets, balls: 60, extras: r(5, 15), fours: Math.floor(teamARuns / 6), sixes: Math.floor(teamARuns / 12), runRate: parseFloat((teamARuns / 10).toFixed(2)) };
      matchObj.score.teamB = { battingTeam: 'teamB', runs: teamBRuns, wickets: teamBWickets, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 };
      matchObj.teamAResult = { runs: teamARuns, wickets: teamAWickets, overs: `10.0` };
      matchObj.teamBResult = { runs: teamBRuns, wickets: teamBWickets, overs: `0.0` };
      matchObj.winner = 'teamA';
      matchObj.margin = `${teamARuns} runs`;

      // Player stats
      const batNames = [...new Set(events.filter(e => e.runs > 0 || e.wicket).map(e => e.batsman))];
      batNames.forEach(name => {
        const playerEvents = events.filter(e => e.batsman === name);
        const runs = playerEvents.filter(e => e.battingTeam === 'teamA').reduce((s, e) => s + e.runs, 0);
        const balls = playerEvents.filter(e => e.battingTeam === 'teamA' && !e.extras?.type).length;
        const fours = playerEvents.filter(e => e.isFour).length;
        const sixes = playerEvents.filter(e => e.isSix).length;
        const out = playerEvents.some(e => e.wicket && e.battingTeam === 'teamA');
        matchObj.playerStats.batting.push({
          playerName: name,
          team: 'teamA',
          runs,
          balls: balls || 1,
          fours,
          sixes,
          strikeRate: balls > 0 ? parseFloat(((runs / balls) * 100).toFixed(2)) : 0,
          out,
          dismissalType: out ? 'bowled' : '',
          bowledBy: out ? 'Nabin Singh' : '',
        });
      });

      const bowlNames = [...new Set(events.filter(e => e.battingTeam === 'teamA').map(e => e.bowler))];
      bowlNames.forEach(name => {
        const playerEvents = events.filter(e => e.bowler === name && e.battingTeam === 'teamA');
        const runs = playerEvents.reduce((s, e) => s + e.runs + (e.extras?.runs || 0), 0);
        const legal = playerEvents.filter(e => !e.extras?.type || (e.extras.type !== 'wide' && e.extras.type !== 'no_ball'));
        const wckts = playerEvents.filter(e => e.wicket).length;
        matchObj.playerStats.bowling.push({
          playerName: name,
          team: 'teamB',
          overs: Math.floor(legal.length / 6),
          balls: legal.length,
          runs,
          wickets: wckts,
          economy: legal.length > 0 ? parseFloat(((runs / legal.length) * 6).toFixed(2)) : 0,
          wides: playerEvents.filter(e => e.extras?.type === 'wide').length,
          noBalls: playerEvents.filter(e => e.extras?.type === 'no_ball').length,
        });
      });
    }

    if (isLive) {
      const events = generateBallEvents(3);
      matchObj.events = events;
      matchObj.currentOver = events.slice(-6);
      matchObj.currentOverNumber = 3;
      const teamARuns = events.filter(e => e.battingTeam === 'teamA').reduce((s, e) => s + e.runs + (e.extras?.runs || 0), 0);
      const teamAWickets = events.filter(e => e.battingTeam === 'teamA' && e.wicket).length;
      matchObj.score.teamA = { battingTeam: 'teamA', runs: teamARuns, wickets: teamAWickets, balls: 18, extras: r(2, 6), fours: Math.floor(teamARuns / 6), sixes: Math.floor(teamARuns / 12), runRate: parseFloat((teamARuns / 3).toFixed(2)) };
      matchObj.teamAResult = { runs: teamARuns, wickets: teamAWickets, overs: '3.0' };
      matchObj.teamBResult = { runs: 0, wickets: 0, overs: '0.0' };
    }

    const match = await matchModel.create(matchObj);
    console.log(`Created ${isCompleted ? 'completed' : isLive ? 'live' : 'upcoming'} league match:`, match._id);

    // Update season's matches array
    await seasonModel.findByIdAndUpdate(season._id, { $push: { matches: match._id } });
  }

  // Playoff matches
  const semi1 = await matchModel.create({
    seasonNumber: season._id,
    stage: 'playoff',
    matchTime: new Date(now.getTime() + 5 * 86400000),
    venue: 'UPPL Cricket Ground',
    teamA: teams[0]._id,
    teamB: teams[2]._id,
    result: 'upcoming',
    score: {
      teamA: { battingTeam: 'teamA', runs: 0, wickets: 0, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 },
      teamB: { battingTeam: 'teamB', runs: 0, wickets: 0, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 },
    },
    events: [],
    currentOver: [],
    currentOverNumber: 0,
    battingFirst: 'teamA',
    playerStats: { batting: [], bowling: [] },
  });
  await seasonModel.findByIdAndUpdate(season._id, { $push: { matches: semi1._id } });
  console.log('Created playoff 1:', semi1._id);

  const semi2 = await matchModel.create({
    seasonNumber: season._id,
    stage: 'playoff',
    matchTime: new Date(now.getTime() + 6 * 86400000),
    venue: 'UPPL Cricket Ground',
    teamA: teams[4]._id,
    teamB: teams[6]._id,
    result: 'upcoming',
    score: {
      teamA: { battingTeam: 'teamA', runs: 0, wickets: 0, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 },
      teamB: { battingTeam: 'teamB', runs: 0, wickets: 0, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 },
    },
    events: [],
    currentOver: [],
    currentOverNumber: 0,
    battingFirst: 'teamA',
    playerStats: { batting: [], bowling: [] },
  });
  await seasonModel.findByIdAndUpdate(season._id, { $push: { matches: semi2._id } });
  console.log('Created playoff 2:', semi2._id);

  const finalMatch = await matchModel.create({
    seasonNumber: season._id,
    stage: 'final',
    matchTime: new Date(now.getTime() + 8 * 86400000),
    venue: 'UPPL Cricket Stadium',
    teamA: teams[0]._id,
    teamB: teams[4]._id,
    result: 'upcoming',
    score: {
      teamA: { battingTeam: 'teamA', runs: 0, wickets: 0, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 },
      teamB: { battingTeam: 'teamB', runs: 0, wickets: 0, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 },
    },
    events: [],
    currentOver: [],
    currentOverNumber: 0,
    battingFirst: 'teamA',
    playerStats: { batting: [], bowling: [] },
  });
  await seasonModel.findByIdAndUpdate(season._id, { $push: { matches: finalMatch._id } });
  console.log('Created final:', finalMatch._id);

  // Set season 5 not current, season 100 is current
  await seasonModel.updateMany({}, { isCurrent: false });
  await seasonModel.findByIdAndUpdate(season._id, { isCurrent: true });

  console.log('\n✅ Season 100 seed complete!');
  console.log(`  - 8 teams, 15 players each`);
  console.log(`  - 4 league matches (2 completed, 1 live, 1 upcoming)`);
  console.log(`  - 2 playoffs (upcoming)`);
  console.log(`  - 1 final (upcoming)`);
  console.log(`  - Season 100 set as current`);

  // 5. Create Playing XI and update match state for all matches
  const allMatches = await matchModel.find({ seasonNumber: season._id });
  for (const match of allMatches) {
    const tA = teams.find(t => t._id.equals(match.teamA));
    const tB = teams.find(t => t._id.equals(match.teamB));
    if (!tA || !tB) continue;

    const aNames = (tA.players || []).map(p => p.name).filter(Boolean).slice(0, 15);
    const bNames = (tB.players || []).map(p => p.name).filter(Boolean).slice(0, 15);

    // Create PlayingXI records
    for (const [teamKey, names] of [['teamA', aNames], ['teamB', bNames]]) {
      const xiPlayers = names.map((name, idx) => ({
        playerId: '', playerName: name,
        role: idx < 6 ? 'batsman' : idx < 11 ? 'bowler' : 'all-rounder',
        isCaptain: idx === 0, isKeeper: idx === 1, battingOrder: idx + 1,
      }));
      if (xiPlayers.length >= 11) {
        await PlayingXI.findOneAndUpdate(
          { matchId: match._id, team: teamKey },
          { matchId: match._id, team: teamKey, players: xiPlayers },
          { upsert: true }
        );
      }
    }

    // Set match state
    match.tossWinner = 'teamA';
    match.tossDecision = 'bat';
    match.battingFirst = 'teamA';
    match.battingOrderA = aNames.slice(0, 11);
    match.battingOrderB = bNames.slice(0, 11);
    match.nextBatAIndex = 2;
    match.nextBatBIndex = 2;
    match.dismissedPlayers = [];

    if (match.result === 'live') {
      match.currentInnings = 1;
      match.inningsStarted = true;
      match.striker = aNames[0] || '';
      match.nonStriker = aNames[1] || '';
      match.currentBowler = bNames[2] || '';
      match.legalBallsInOver = match.events?.length
        ? (match.events.filter(e => !e.extras?.type || (e.extras.type !== 'wide' && e.extras.type !== 'no_ball')).length % 6)
        : 0;
      match.currentOverNumber = match.events?.length
        ? Math.floor(match.events.filter(e => !e.extras?.type || (e.extras.type !== 'wide' && e.extras.type !== 'no_ball')).length / 6) + 1
        : 1;
      match.dismissedPlayers = [...new Set(match.events.filter(e => e.wicket).map(e => e.batsman).filter(Boolean))];
    }

    if (match.result === 'completed') {
      match.currentInnings = 2;
      match.inningsStarted = false;
      match.firstInningsCompleted = true;
      match.striker = '';
      match.nonStriker = '';
      match.currentBowler = '';
      match.dismissedPlayers = [...new Set(match.events.filter(e => e.wicket).map(e => e.batsman).filter(Boolean))];
    }

    await match.save();
    console.log(`  Updated match state: ${match._id}`);
  }

  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
