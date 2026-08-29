const mongoose = require('mongoose');
require('dotenv').config();

const seasonModel = require('./models/seasonModel');
const teamModel = require('./models/teamModel');
const groupScheduleModel = require('./models/groupScheduleModel');
const matchModel = require('./models/matchModel');
const PlayingXI = require('./models/PlayingXI');
const Ball = require('./models/Ball');

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
  'Kamal Aire', 'Deepak Deuba', 'Gagan Joshi', 'Bijay Singh', 'Ashok Karki',
  'Saroj Rana', 'Milan Chaudhary', 'Raju Gurung', 'Bibek Tamang', 'Umesh Shahi',
];

const WICKET_TYPES = ['bowled', 'caught', 'lbw', 'run_out', 'stumped'];

function generateBallEvents(oversCount, battingTeam, aNames, bNames) {
  const events = [];
  let sIdx = 0, nsIdx = 1;
  let striker = aNames[sIdx] || 'Batsman A';
  let nonStriker = aNames[nsIdx] || 'Batsman B';
  let bowler = bNames?.[2] || 'Bowler X';
  let nextBat = 2;

  for (let o = 0; o < oversCount; o++) {
    for (let b = 0; b < 6; b++) {
      const extrasRoll = Math.random();
      let extras = null;
      if (extrasRoll < 0.06) extras = { type: 'wide', runs: r(0, 2) };
      else if (extrasRoll < 0.12) extras = { type: 'no_ball', runs: r(0, 2) };

      const isWicket = !extras && Math.random() < 0.10;
      const runs = isWicket ? 0 : pick([0, 0, 0, 0, 1, 1, 1, 2, 3, 4, 4, 6]);

      const event = {
        over: o, ball: b + 1, runs, extras, wicket: isWicket,
        wicketType: isWicket ? pick(WICKET_TYPES) : null,
        batsman: striker, bowler,
        fielder: isWicket ? pick(bNames || aNames) : '',
        battingTeam, description: '',
        isFour: runs === 4, isSix: runs === 6,
      };

      if (isWicket && aNames?.[nextBat]) {
        event.newBatsman = aNames[nextBat];
        nextBat++;
        if (nextBat - sIdx <= 1) striker = event.newBatsman;
        else nonStriker = event.newBatsman;
      }

      events.push(event);
      const total = runs + (extras?.runs || 0);
      if (total % 2 === 1 && !extras) [striker, nonStriker] = [nonStriker, striker];
    }
    if (bNames) bowler = pick(bNames.filter(n => n !== bowler));
  }
  return events;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Clean up season 101 if exists
  const existing = await seasonModel.findOne({ seasonNumber: 101 });
  if (existing) {
    console.log('Removing existing season 101 data...');
    await Ball.deleteMany({ matchId: { $in: existing.matches } });
    await PlayingXI.deleteMany({ matchId: { $in: existing.matches } });
    await matchModel.deleteMany({ seasonNumber: existing._id });
    await teamModel.deleteMany({ seasonNumber: existing._id });
    await groupScheduleModel.deleteMany({ seasonNumber: existing._id });
    await seasonModel.findByIdAndDelete(existing._id);
    console.log('Cleaned up season 101');
  }

  // 1. Create season
  const season = await seasonModel.create({
    seasonNumber: 101,
    entryDeadline: new Date('2026-12-31'),
    isCurrent: false,
  });
  console.log('Created season 101:', season._id);

  // Get admin
  const admin = await mongoose.connection.db.collection('users').findOne({ role: 'admin' });
  if (!admin) { console.error('No admin found'); process.exit(1); }
  console.log('Using admin:', admin.name);

  const TEAM_DATA = [
    { name: 'UPPL Eagles', code: 'E101', cap: 'Rajesh Hamal', group: 'A' },
    { name: 'UPPL Hawks', code: 'H101', cap: 'Bhuwan Kc', group: 'A' },
    { name: 'UPPL Titans', code: 'T101', cap: 'Shree Krishna', group: 'B' },
    { name: 'UPPL Chargers', code: 'C101', cap: 'Sagar Rai', group: 'B' },
    { name: 'UPPL Warriors', code: 'W101', cap: 'Nabin Singh', group: 'C' },
    { name: 'UPPL Strikers', code: 'S101', cap: 'Anil Thapa', group: 'C' },
    { name: 'UPPL Royals', code: 'R101', cap: 'Prakash Thapa', group: 'D' },
    { name: 'UPPL Kings', code: 'K101', cap: 'Kiran Saud', group: 'D' },
  ];

  // 2. Create teams with embedded players
  let nameIdx = 0;
  const teams = [];
  for (let i = 0; i < TEAM_DATA.length; i++) {
    const td = TEAM_DATA[i];
    const players = [];
    const usedNames = new Set();
    for (let p = 0; p < 15; p++) {
      let pname = PLAYER_NAMES[nameIdx % PLAYER_NAMES.length];
      while (usedNames.has(pname)) { nameIdx++; pname = PLAYER_NAMES[nameIdx % PLAYER_NAMES.length]; }
      usedNames.add(pname);
      nameIdx++;
      players.push({
        user: null, status: 'not_registered',
        position: p < 6 ? 'batsman' : p < 11 ? 'bowler' : 'all-rounder',
        jerseyNumber: p + 1, code: null, name: pname,
      });
    }

    const team = await teamModel.create({
      teamName: td.name,
      teamLogo: { url: 'https://res.cloudinary.com/dv0emra21/image/upload/v1760115617/teams/logos/jadnllb7mctaupsl0qjf.jpg', public_id: `seed101-team-${i}` },
      captainName: td.cap, coachName: '', managerName: '', contactNumber: '9800000000',
      seasonNumber: season._id, groupName: td.group, players,
      createdBy: admin._id,
      paymentReceipt: { url: 'https://res.cloudinary.com/dv0emra21/image/upload/v1759821733/teams/paymentReceipts/yxwjiluvzn3w250nmp8f.jpg', public_id: `receipt-${i}` },
      status: 'approved', teamCode: td.code, color: td.color,
    });
    teams.push(team);
    console.log('Created team:', td.name);
  }

  // 3. Create group schedule
  const groups = ['A', 'B', 'C', 'D'].map(g => ({
    groupName: g,
    teams: teams.filter(t => t.groupName === g).map(t => ({ team: t._id, teamName: t.teamName, teamCode: t.teamCode })),
  }));
  await groupScheduleModel.create({ seasonNumber: season._id, groups, generatedAt: new Date() });
  console.log('Created group schedule');

  // 4. Create matches
  const now = new Date();
  const matchDefs = [
    // 2 completed, 1 live, 1 upcoming per group = 8 league matches total
    { teams: groups[0].teams, result: 'completed', overs: 8 },
    { teams: groups[0].teams, result: 'upcoming', overs: 0 },
    { teams: groups[1].teams, result: 'completed', overs: 6 },
    { teams: groups[1].teams, result: 'live', overs: 4 },
    { teams: groups[2].teams, result: 'completed', overs: 10 },
    { teams: groups[2].teams, result: 'upcoming', overs: 0 },
    { teams: groups[3].teams, result: 'completed', overs: 7 },
    { teams: groups[3].teams, result: 'live', overs: 2 },
  ];

  const allCreated = [];
  for (let i = 0; i < matchDefs.length; i++) {
    const md = matchDefs[i];
    const ta = teams.find(t => t._id.equals(md.teams[0].team));
    const tb = teams.find(t => t._id.equals(md.teams[1].team));
    if (!ta || !tb) continue;

    const aNames = ta.players.map(p => p.name).filter(Boolean).slice(0, 11);
    const bNames = tb.players.map(p => p.name).filter(Boolean).slice(0, 11);

    const isComp = md.result === 'completed';
    const isLive = md.result === 'live';

    const matchObj = {
      seasonNumber: season._id,
      stage: 'league',
      groupName: groups.find(g => g.teams.some(t => t.team.equals(ta._id)))?.groupName || 'A',
      matchTime: new Date(now.getTime() + i * 86400000),
      venue: 'UPPL Cricket Ground',
      teamA: ta._id, teamB: tb._id,
      result: md.result,
      score: {
        teamA: { battingTeam: 'teamA', runs: 0, wickets: 0, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 },
        teamB: { battingTeam: 'teamB', runs: 0, wickets: 0, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 },
      },
      events: [], currentOver: [], currentOverNumber: 0,
      battingFirst: 'teamA',
      tossWinner: 'teamA', tossDecision: 'bat',
      battingOrderA: aNames, battingOrderB: bNames,
      nextBatAIndex: 2, nextBatBIndex: 2,
      dismissedPlayers: [],
      playerStats: { batting: [], bowling: [] },
    };

    if (isComp || isLive) {
      const events = generateBallEvents(md.overs, 'teamA', aNames, bNames);
      matchObj.events = events;
      matchObj.currentOver = events.slice(-6);
      matchObj.currentOverNumber = md.overs;
      matchObj.inningsStarted = true;

      const tARuns = events.reduce((s, e) => s + e.runs + (e.extras?.runs || 0), 0);
      const tAWickets = events.filter(e => e.wicket).length;

      matchObj.score.teamA = {
        battingTeam: 'teamA', runs: tARuns, wickets: tAWickets,
        balls: md.overs * 6, extras: r(3, 12), fours: Math.floor(tARuns / 6),
        sixes: Math.floor(tARuns / 12), runRate: parseFloat((tARuns / md.overs).toFixed(2)),
      };
      matchObj.striker = aNames[0]; matchObj.nonStriker = aNames[1];
      matchObj.currentBowler = bNames[2] || '';
      matchObj.dismissedPlayers = [...new Set(events.filter(e => e.wicket).map(e => e.batsman))];

      // Batting stats
      const batMap = {};
      events.forEach(e => {
        if (!e.batsman) return;
        if (!batMap[e.batsman]) batMap[e.batsman] = { playerName: e.batsman, team: 'teamA', runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0, out: false, dismissalType: '', bowledBy: '' };
        batMap[e.batsman].runs += e.runs;
        if (!e.extras?.type || (e.extras.type !== 'wide')) batMap[e.batsman].balls += 1;
        if (e.isFour) batMap[e.batsman].fours += 1;
        if (e.isSix) batMap[e.batsman].sixes += 1;
        if (e.wicket) { batMap[e.batsman].out = true; batMap[e.batsman].dismissalType = e.wicketType || 'bowled'; batMap[e.batsman].bowledBy = e.bowler; }
      });
      Object.values(batMap).forEach((b) => {
        b.strikeRate = b.balls > 0 ? parseFloat(((b.runs / b.balls) * 100).toFixed(2)) : 0;
        matchObj.playerStats.batting.push(b);
      });

      // Bowling stats
      const bowlMap = {};
      events.forEach(e => {
        if (!e.bowler) return;
        if (!bowlMap[e.bowler]) bowlMap[e.bowler] = { playerName: e.bowler, team: 'teamB', overs: 0, balls: 0, runs: 0, wickets: 0, economy: 0, wides: 0, noBalls: 0 };
        bowlMap[e.bowler].runs += e.runs + (e.extras?.runs || 0);
        if (e.extras?.type === 'wide') bowlMap[e.bowler].wides += 1;
        if (e.extras?.type === 'no_ball') bowlMap[e.bowler].noBalls += 1;
        if (e.wicket) bowlMap[e.bowler].wickets += 1;
        if (!e.extras?.type || (e.extras.type !== 'wide' && e.extras.type !== 'no_ball')) bowlMap[e.bowler].balls += 1;
      });
      Object.values(bowlMap).forEach((b) => {
        b.overs = Math.floor(b.balls / 6);
        b.economy = b.balls > 0 ? parseFloat(((b.runs / b.balls) * 6).toFixed(2)) : 0;
        matchObj.playerStats.bowling.push(b);
      });
    }

    if (isComp) {
      matchObj.currentInnings = 2;
      matchObj.firstInningsCompleted = true;
      matchObj.striker = ''; matchObj.nonStriker = ''; matchObj.currentBowler = '';
      const tARuns = matchObj.score.teamA.runs;
      matchObj.winner = 'teamA';
      matchObj.margin = `${tARuns} runs`;
      matchObj.teamAResult = { runs: tARuns, wickets: matchObj.score.teamA.wickets, overs: `${md.overs}.0` };
      matchObj.teamBResult = { runs: 0, wickets: 0, overs: `0.0` };
    }

    if (isLive) {
      matchObj.currentInnings = 1;
      const tARuns = matchObj.score.teamA.runs;
      matchObj.teamAResult = { runs: tARuns, wickets: matchObj.score.teamA.wickets, overs: `${md.overs}.0` };
      matchObj.teamBResult = { runs: 0, wickets: 0, overs: '0.0' };
    }

    const match = await matchModel.create(matchObj);
    allCreated.push(match);
    await seasonModel.findByIdAndUpdate(season._id, { $push: { matches: match._id } });
    console.log(`  Match ${i+1}: ${md.result}`);
  }

  // 5. Create Playing XI for all matches
  for (const match of allCreated) {
    const ta = teams.find(t => t._id.equals(match.teamA));
    const tb = teams.find(t => t._id.equals(match.teamB));
    if (!ta || !tb) continue;

      for (const pair of [['teamA', ta], ['teamB', tb]]) {
        const key = pair[0];
        const t = pair[1];
      const names = t.players.map(p => p.name).filter(Boolean).slice(0, 11);
      const players = names.map((name, idx) => ({
        playerId: '', playerName: name,
        role: idx < 6 ? 'batsman' : idx < 11 ? 'bowler' : 'all-rounder',
        isCaptain: idx === 0, isKeeper: idx === 1, battingOrder: idx + 1,
      }));
      if (players.length >= 11) {
        await PlayingXI.findOneAndUpdate(
          { matchId: match._id, team: key },
          { matchId: match._id, team: key, players },
          { upsert: true }
        );
      }
    }
  }

  // Don't set as current — let season 100 remain current
  console.log('\n✅ Season 101 seed complete!');
  console.log('  8 teams x 15 players');
  console.log('  8 league matches (4 completed, 2 live, 2 upcoming)');
  console.log('  Season NOT set as current (season 100 remains active)');

  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
