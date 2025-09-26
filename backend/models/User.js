const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
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

    // ✅ Player-specific fields
    phone: { type: String, default: 'N/A' },
    bio: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    position: { type: String, default: '' },
    battingStyle: { type: String, default: '' },
    bowlingStyle: { type: String, default: '' },

    // ✅ Cloudinary media
    profileImage: {
      url: { type: String, default: '' },
      public_id: { type: String, default: '' },
    },

    documents: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],

    // ✅ Password reset OTP flow
    resetOtp: { type: String },
    resetOtpExpires: { type: Date },
    resetOtpAttempts: { type: Number, default: 0 },
    resetOtpLockedUntil: { type: Date },
  },
  { timestamps: true }
);

// ✅ Hash password before saving
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
