const mongoose = require("mongoose");

// =========================
// Organization Sponsor
// =========================
const organizationSponsorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    bio: { type: String },
    donationAmount: { type: Number, default: 0 },
    logo: {
      url: { type: String },       // Cloudinary secure URL
      public_id: { type: String }, // Cloudinary public_id
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// =========================
// Individual Sponsor
// =========================
const individualSponsorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    bio: { type: String },
    donationAmount: { type: Number, default: 0 },
    avatar: {
      url: { type: String },       // Cloudinary secure URL
      public_id: { type: String }, // Cloudinary public_id
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const OrganizationSponsor = mongoose.model(
  "OrganizationSponsor",
  organizationSponsorSchema
);
const IndividualSponsor = mongoose.model(
  "IndividualSponsor",
  individualSponsorSchema
);

module.exports = { OrganizationSponsor, IndividualSponsor };
