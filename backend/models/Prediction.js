// models/Prediction.js
const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
  predictedWinnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prediction', PredictionSchema);