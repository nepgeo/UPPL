const mongoose = require('mongoose');

const ballEventSchema = new mongoose.Schema({
  over: { type: Number, required: true },
  ball: { type: Number, required: true },
  runs: { type: Number, default: 0 },
  extras: {
    type: { type: String, enum: ['wide', 'no_ball', 'bye', 'leg_bye', 'penalty', null], default: null },
    runs: { type: Number, default: 0 }
  },
  wicket: { type: Boolean, default: false },
  wicketType: { type: String, enum: ['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'retired_out', 'timed_out', 'handled_ball', 'obstructing_field', 'hit_ball_twice', null], default: null },
  batsman: { type: String, default: '' },
  bowler: { type: String, default: '' },
  fielder: { type: String, default: '' },
  battingTeam: { type: String, enum: ['teamA', 'teamB'], required: true },
  description: { type: String, default: '' },
  isFour: { type: Boolean, default: false },
  isSix: { type: Boolean, default: false },
  freeHit: { type: Boolean, default: false },
  isDeadBall: { type: Boolean, default: false }
}, { _id: false });

const inningsSchema = new mongoose.Schema({
  battingTeam: { type: String, enum: ['teamA', 'teamB'], required: true },
  runs: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  balls: { type: Number, default: 0 },
  extras: { type: Number, default: 0 },
  fours: { type: Number, default: 0 },
  sixes: { type: Number, default: 0 },
  runRate: { type: Number, default: 0 }
}, { _id: false });

const playerBattingSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  playerName: { type: String },
  team: { type: String, enum: ['teamA', 'teamB'] },
  runs: { type: Number, default: 0 },
  balls: { type: Number, default: 0 },
  fours: { type: Number, default: 0 },
  sixes: { type: Number, default: 0 },
  strikeRate: { type: Number, default: 0 },
  out: { type: Boolean, default: false },
  dismissalType: { type: String, default: '' },
  bowledBy: { type: String, default: '' }
}, { _id: false });

const playerBowlingSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  playerName: { type: String },
  team: { type: String, enum: ['teamA', 'teamB'] },
  overs: { type: Number, default: 0 },
  balls: { type: Number, default: 0 },
  runs: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  economy: { type: Number, default: 0 },
  wides: { type: Number, default: 0 },
  noBalls: { type: Number, default: 0 },
  maidens: { type: Number, default: 0 },
  currentOverRuns: { type: Number, default: 0 }
}, { _id: false });

const twenty20Schema = new mongoose.Schema({
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
  venue: { type: String, default: '' },

  result: {
    type: String,
    enum: ['upcoming', 'live', 'completed'],
    default: 'upcoming'
  },

  teamAResult: {
    runs: Number,
    wickets: Number,
    overs: String
  },
  teamBResult: {
    runs: Number,
    wickets: Number,
    overs: String
  },

  score: {
    teamA: { type: inningsSchema, default: () => ({ battingTeam: 'teamA' }) },
    teamB: { type: inningsSchema, default: () => ({ battingTeam: 'teamB' }) }
  },

  events: [ballEventSchema],
  currentOver: [ballEventSchema],
  currentOverNumber: { type: Number, default: 0 },
  battingFirst: { type: String, enum: ['teamA', 'teamB'], default: 'teamA' },

  // Toss
  tossWinner: { type: String, enum: ['teamA', 'teamB', null], default: null },
  tossDecision: { type: String, enum: ['bat', 'bowl', null], default: null },

  // Innings state
  currentInnings: { type: Number, default: 1 },
  inningsStarted: { type: Boolean, default: false },
  firstInningsCompleted: { type: Boolean, default: false },

  // Current players
  striker: { type: String, default: '' },
  nonStriker: { type: String, default: '' },
  currentBowler: { type: String, default: '' },

  // Batting order tracking
  battingOrderA: [{ type: String }],
  battingOrderB: [{ type: String }],
  nextBatAIndex: { type: Number, default: 0 },
  nextBatBIndex: { type: Number, default: 0 },
  dismissedPlayers: [{ type: String }],

  // Bowling order tracking
  bowlerQueue: [{ type: String }],

  // Over state
  legalBallsInOver: { type: Number, default: 0 },
  overCompleted: { type: Boolean, default: false },
  currentOverRuns: { type: Number, default: 0 },
  currentOverExtras: { type: Boolean, default: false },

  // Free Hit
  freeHit: { type: Boolean, default: false },

  // Powerplay
  powerplayActive: { type: Boolean, default: true },
  powerplayOvers: { type: Number, default: 6 },

  winner: {
    type: String,
    enum: ['teamA', 'teamB', 'draw', 'tie', 'no_result']
  },

  margin: {
    type: String
  },

  matchNumber: { type: Number },
  matchLabel: { type: String },

  fixed: {
    type: Boolean,
    default: false
  },

  playerStats: {
    batting: [playerBattingSchema],
    bowling: [playerBowlingSchema]
  }

}, { timestamps: true });

const matchSchema = twenty20Schema;

matchSchema.set('toJSON', { virtuals: true });
matchSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Match || mongoose.model('Match', matchSchema);
