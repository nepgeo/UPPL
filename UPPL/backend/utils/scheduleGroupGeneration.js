const Season = require('../models/seasonModel');
const Team = require('../models/teamModel');
const GroupSchedule = require('../models/groupScheduleModel');
const { shuffleArray, buildGroups } = require('./groupLogic');

async function checkAndGenerateGroups() {
  const now = new Date();

  // Find seasons that have passed deadline + 12hr OR manual trigger time, and groups not generated yet
  const seasons = await Season.find({
    $or: [
      { scheduleGenerationTime: { $lte: now } },
      {
        entryDeadline: { $lte: new Date(now.getTime() - 12 * 60 * 60 * 1000) },
        scheduleGenerationTime: { $exists: false },
      },
    ],
  });

  for (const season of seasons) {
    const alreadyExists = await GroupSchedule.findOne({ seasonNumber: season._id });
    if (alreadyExists) continue; // already generated

    const teams = await Team.find({ seasonNumber: season._id, status: 'approved' })
      .select('_id teamName teamCode')
      .lean();

    if (teams.length < 2) continue; // skip if not enough

    const shuffled = shuffleArray(teams);
    const groups = buildGroups(shuffled); // your group logic

    const schedule = new GroupSchedule({
      seasonNumber: season._id,
      groups,
    });

    await schedule.save();
    console.log(`✅ Generated groups for season ${season.seasonNumber}`);
  }
}

function startAutoGroupScheduler(intervalMinutes = 15) {
  console.log('⏰ Auto group scheduler started...');
  setInterval(checkAndGenerateGroups, intervalMinutes * 60 * 1000);
}

module.exports = { startAutoGroupScheduler };
