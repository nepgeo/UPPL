const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function backfill() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to:', mongoose.connection.db.databaseName);

  const User = require('../models/User');
  const Player = require('../models/Player');

  const playerUsers = await User.find({ role: 'player', verified: true });
  console.log(`Found ${playerUsers.length} verified player users`);

  let created = 0;
  for (const user of playerUsers) {
    const exists = await Player.findOne({ userId: user._id });
    if (exists) {
      console.log(`  Skipping ${user.name} — Player doc already exists`);
      continue;
    }
    await Player.create({
      userId: user._id,
      position: user.position || '',
      battingStyle: user.battingStyle || '',
      bowlingStyle: user.bowlingStyle || '',
      documents: user.documents?.map(d => d.url || d) || [],
      verified: true,
    });
    console.log(`  Created Player doc for ${user.name} (${user.email})`);
    created++;
  }

  console.log(`\nDone. Created ${created} new Player documents.`);
  await mongoose.disconnect();
}

backfill().catch(err => { console.error(err); process.exit(1); });
