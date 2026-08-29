const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  seasonNumber: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true },
  groups: [
    {
      groupName: String, // A, B, C, etc.
      teams: [
        {
          team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team',required: true },
          teamName: String,
          teamCode: String,
        }
      ],
    }
  ],
  scheduleGenerationTime: { type: Date }, 
  generatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroupSchedule', groupSchema);
