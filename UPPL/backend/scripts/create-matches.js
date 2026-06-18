const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Match = require('../models/matchModel');
  const Season = require('../models/seasonModel');

  const season = await Season.findOne({ seasonNumber: 101 }).lean();
  if (!season) { console.log('No season found'); process.exit(1); }

  const teamIds = [
    '6a2b1a995a625d58606fb749','6a2b1a995a625d58606fb75b',
    '6a2b1a995a625d58606fb76c','6a2b1a995a625d58606fb77d',
    '6a2b1a9a5a625d58606fb78e','6a2b1a9a5a625d58606fb79f',
    '6a2b1a9a5a625d58606fb7b0','6a2b1a9a5a625d58606fb7c1'
  ];

  const venues = [
    'UPPL Stadium','Central Ground','City Park','Riverside Arena',
    'Sports Complex','National Ground','Green Field','Cricket Arena',
    'Town Hall Ground','Elite Park'
  ];

  const matches = [];
  for (let i = 0; i < 10; i++) {
    const t1 = teamIds[i % teamIds.length];
    const t2 = teamIds[(i + 5) % teamIds.length];
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    date.setHours(14 + (i % 2), 0, 0, 0);

    matches.push({
      seasonNumber: season._id,
      stage: i < 8 ? 'league' : (i === 8 ? 'playoff' : 'final'),
      groupName: i < 8 ? String.fromCharCode(65 + (i % 4)) : undefined,
      teamA: t1,
      teamB: t2,
      matchTime: date,
      venue: venues[i],
      result: 'upcoming',
      score: {
        teamA: { battingTeam: 'teamA', runs: 0, wickets: 0, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 },
        teamB: { battingTeam: 'teamB', runs: 0, wickets: 0, balls: 0, extras: 0, fours: 0, sixes: 0, runRate: 0 }
      }
    });
  }

  await Match.insertMany(matches);
  console.log('Created ' + matches.length + ' matches');
  mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
