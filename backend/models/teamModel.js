const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  status: {
    type: String,
    enum: ['verified', 'pending', 'not_registered'],
    default: 'not_registered',
  },
  position: {
    type: String,
    default: '',
  },
  jerseyNumber: {
    type: Number,
    default: null,
  },
  code: { type: String }, // 🆕 add this if not already
  name: { type: String },
});

const teamSchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true },

    // ✅ Cloudinary logo
    teamLogo: {
      url: { type: String, default: '' },
      public_id: { type: String, default: '' },
    },

    captainName: { type: String, required: true },
    coachName: { type: String, default: '' },
    managerName: { type: String, default: '' },
    contactNumber: { type: String },

    paymentMethod: {
      type: String,
      enum: ['esewa', 'khalti', 'bank', 'other'],
      default: 'esewa',
    },

    seasonNumber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Season',
      required: true,
    },

    groupName: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
      default: undefined,
    },

    players: [playerSchema],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ✅ Cloudinary receipt
    paymentReceipt: {
      url: { type: String, default: '' },
      public_id: { type: String, default: '' },
    },

    status: {
      type: String,
      enum: ['pending', 'pending_payment', 'approved', 'rejected'],
      default: 'pending',
    },

    teamCode: {
      type: String,
      unique: true,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);
