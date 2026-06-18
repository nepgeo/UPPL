const mongoose = require("mongoose");

const organizationSponsorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    bio: { type: String },
    donationAmount: { type: Number, default: 0 },
    logo: { url: { type: String }, public_id: { type: String } },
    isActive: { type: Boolean, default: true },
    tier: { type: String, enum: ["platinum", "gold", "silver", "bronze"], default: "bronze" },
    website: { type: String },
    email: { type: String },
    phone: { type: String },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const individualSponsorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    bio: { type: String },
    donationAmount: { type: Number, default: 0 },
    avatar: { url: { type: String }, public_id: { type: String } },
    isActive: { type: Boolean, default: true },
    tier: { type: String, enum: ["platinum", "gold", "silver", "bronze"], default: "bronze" },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const OrganizationSponsor = mongoose.model("OrganizationSponsor", organizationSponsorSchema);
const IndividualSponsor = mongoose.model("IndividualSponsor", individualSponsorSchema);

module.exports = { OrganizationSponsor, IndividualSponsor };
