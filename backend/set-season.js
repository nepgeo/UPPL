const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  await db.collection('seasons').updateMany({}, { $set: { isCurrent: false } });
  await db.collection('seasons').updateOne({ seasonNumber: 101 }, { $set: { isCurrent: true } });
  const s = await db.collection('seasons').findOne({ seasonNumber: 101 });
  console.log('Season 101 isCurrent:', s.isCurrent);
  mongoose.disconnect();
}).catch(e => console.error(e.message));
