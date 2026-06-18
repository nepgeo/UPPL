const mongoose = require('mongoose');

const BallSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
  innings: { type: Number, default: 1 },
  overNumber: { type: Number, required: true },
  ballNumber: { type: Number, required: true },
  battingTeam: { type: String, enum: ['teamA', 'teamB'], required: true },
  bowlingTeam: { type: String, enum: ['teamA', 'teamB'], required: true },
  striker: { type: String, default: '' },
  nonStriker: { type: String, default: '' },
  bowler: { type: String, default: '' },
  runs: { type: Number, default: 0 },
  extraRuns: { type: Number, default: 0 },
  extraType: { type: String, enum: ['wide', 'no_ball', 'bye', 'leg_bye', 'penalty', null], default: null },
  isWicket: { type: Boolean, default: false },
  wicketType: { type: String, enum: ['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'retired_out', 'timed_out', 'handled_ball', 'obstructing_field', 'hit_ball_twice', null], default: null },
  dismissedPlayer: { type: String, default: '' },
  newBatsman: { type: String, default: '' },
  fielder: { type: String, default: '' },
  commentary: { type: String, default: '' },
  isFour: { type: Boolean, default: false },
  isSix: { type: Boolean, default: false },
  freeHit: { type: Boolean, default: false },
  isDeadBall: { type: Boolean, default: false },
  scoredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  corrected: { type: Boolean, default: false },
  correctionReason: { type: String, default: '' },
  correctedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

BallSchema.index({ matchId: 1, innings: 1, overNumber: 1, ballNumber: 1 }, { unique: true });

module.exports = mongoose.model('Ball', BallSchema);
