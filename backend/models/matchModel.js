// ✅ models/matchModel.js
const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  seasonNumber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true
  },
  stage: {
    type: String,
    enum: ['league', 'playoff', 'final'],
    required: true
  },
  groupName: String,

  teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: function () { return !this.fixed; } },
  teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: function () { return !this.fixed; } },  


  matchTime: { type: Date, required: true },

  result: {
    type: String,
    enum: ['upcoming', 'live', 'completed'],
    default: 'upcoming'
  },

  teamAResult: {
    runs: Number,
    wickets: Number,
    overs: String  // e.g., '19.5'
  },
  teamBResult: {
    runs: Number,
    wickets: Number,
    overs: String
  },

  winner: {
    type: String,
    enum: ['teamA', 'teamB', 'draw', 'tie', 'no_result']
  },

  margin: {
    type: String // e.g., "20 runs" or "5 wickets"
  },

  matchNumber: { type: Number },
  matchLabel: { type: String },

  fixed: {
  type: Boolean,
  default: false
}

}, { timestamps: true });


// ✅ Include virtuals in JSON responses
matchSchema.set('toJSON', { virtuals: true });
matchSchema.set('toObject', { virtuals: true });

// ✅ Export model safely
module.exports = mongoose.models.Match || mongoose.model('Match', matchSchema);
