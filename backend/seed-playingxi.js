const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Import models so schemas are registered
const seasonModel = require('./models/seasonModel');
const teamModel = require('./models/teamModel');
const matchModel = require('./models/matchModel');
const PlayingXI = require('./models/PlayingXI');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const season = await seasonModel.findOne({ seasonNumber: 100 });
  if (!season) { console.log('No season 100 found'); process.exit(0); }

  const teams = await teamModel.find({ seasonNumber: season._id });
  const matches = await matchModel.find({ seasonNumber: season._id }).populate('teamA teamB');

  console.log(`Found ${teams.length} teams, ${matches.length} matches`);

  for (const match of matches) {
    const teamA = teams.find(t => t._id.equals(match.teamA?._id));
    const teamB = teams.find(t => t._id.equals(match.teamB?._id));
    if (!teamA || !teamB) {
      console.log(`  Skipping match ${match._id} — teams not found`);
      continue;
    }

    const aNames = (teamA.players || []).map(p => p.name).filter(Boolean).slice(0, 15);
    const bNames = (teamB.players || []).map(p => p.name).filter(Boolean).slice(0, 15);

    // Create/update PlayingXI
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
        console.log(`  PlayingXI for ${teamKey} in ${match._id}`);
      }
    }

    // Set match state
    if (!match.tossWinner) {
      match.tossWinner = 'teamA';
      match.tossDecision = 'bat';
      match.battingFirst = 'teamA';
    }

    match.battingOrderA = aNames.slice(0, 11);
    match.battingOrderB = bNames.slice(0, 11);
    match.nextBatAIndex = 2;
    match.nextBatBIndex = 2;

    if (match.result === 'live' || match.result === 'completed') {
      match.currentInnings = 1;
      match.dismissedPlayers = [...new Set((match.events || []).filter(e => e.wicket).map(e => e.batsman).filter(Boolean))];
    }

    if (match.result === 'live') {
      match.inningsStarted = true;
      match.striker = aNames[0] || '';
      match.nonStriker = aNames[1] || '';
      match.currentBowler = bNames[2] || '';
      const legalCount = (match.events || []).filter(e => !e.extras?.type || (e.extras.type !== 'wide' && e.extras.type !== 'no_ball')).length;
      match.legalBallsInOver = legalCount % 6;
      match.currentOverNumber = Math.floor(legalCount / 6) + 1;
    }

    if (match.result === 'completed') {
      match.inningsStarted = false;
      match.firstInningsCompleted = true;
      match.currentInnings = 2;
      match.striker = '';
      match.nonStriker = '';
      match.currentBowler = '';
    }

    await match.save();
    console.log(`  Updated match ${match._id} (${match.result})`);
  }

  console.log('\n✅ PlayingXI migration complete.');
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
