const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  playerCode: {
    type: String,
    unique: true,
    sparse: true, // allows nulls for non-verified users
  },
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    unique: true,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ['super-admin', 'admin', 'player', 'user'],
    default: 'user',
  },

  verified: {
    type: Boolean,
    default: false,
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null,
  },

  // ✅ Player-specific fields (optional for non-players)
  phone: {
    type: String,
    default: 'N/A',
  },
  bio: {
    type: String,
    default: '',
  },
  dateOfBirth: {
    type: String,
    default: '',
  },
  position: {
    type: String,
    default: '',
  },
  battingStyle: {
    type: String,
    default: '',
  },
  bowlingStyle: {
    type: String,
    default: '',
  },

  // ✅ Media & documents
  profileImage: {
    type: String,
    default: '',
  },
  documents: {
    type: [String],
    default: [],
  },
  resetOtp: { type: String },
  resetOtpExpires: { type: Date },
  resetOtpAttempts: { type: Number, default: 0 },
  resetOtpLockedUntil: { type: Date }

}, {
  timestamps: true,
});

// ✅ Hash password before saving
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);


