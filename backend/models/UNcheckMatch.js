// models/Match.js
const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  team1Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  team2Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  date: Date,
  venue: String,
  status: { type: String, enum: ['upcoming', 'live', 'completed'] },
  scoreTeam1: Number,
  scoreTeam2: Number,
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
});

module.exports = mongoose.model('Match', MatchSchema);