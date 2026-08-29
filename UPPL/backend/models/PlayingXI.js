const mongoose = require('mongoose');

const PlayingXISchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  team: { type: String, enum: ['teamA', 'teamB'], required: true },
  players: [{
    playerId: { type: String, default: '' },
    playerName: { type: String, required: true },
    role: { type: String, enum: ['batsman', 'bowler', 'all-rounder', 'wk'], default: 'batsman' },
    isCaptain: { type: Boolean, default: false },
    isKeeper: { type: Boolean, default: false },
    battingOrder: { type: Number, default: 0 },
  }],
}, { timestamps: true });

PlayingXISchema.index({ matchId: 1, team: 1 }, { unique: true });

module.exports = mongoose.model('PlayingXI', PlayingXISchema);
