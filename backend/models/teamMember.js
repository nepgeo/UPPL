const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, required: true },
  avatar: { type: String }, // image path
}, { timestamps: true });

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);
module.exports = TeamMember;
