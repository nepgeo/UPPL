const mongoose = require("mongoose");

const seasonSchema = new mongoose.Schema({
  seasonNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  entryDeadline: {
    type: Date,
    required: true,
  },
  isCurrent: {
    type: Boolean,
    default: false,
  },
  groups: [
  {
    groupName: String,
    teams: [
      {
        team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        teamName: String,
        teamCode: String
      }
    ]
  }
],
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Match" }],
}, { timestamps: true });

module.exports = mongoose.model("Season", seasonSchema);
