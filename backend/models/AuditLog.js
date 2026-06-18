const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  action: { type: String, required: true },
  adminName: { type: String, default: '' },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  oldData: { type: mongoose.Schema.Types.Mixed },
  newData: { type: mongoose.Schema.Types.Mixed },
  reason: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
