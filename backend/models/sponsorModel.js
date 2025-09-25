const mongoose = require('mongoose');

// Schema for organization sponsors
const organizationSponsorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true
  },
  logo: {
    type: String, // Image filename (stored in /uploads/sponsors)
    default: ''
  },
  bio: {
    type: String,
    trim: true
  },
  donationAmount: {
    type: Number,
    default: 0,
    min: [0, 'Donation must be non-negative']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });


// Schema for individual sponsors
const individualSponsorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Individual name is required'],
    trim: true
  },
  avatar: {
    type: String, // Image filename (stored in /uploads/sponsors)
    default: ''
  },
  title: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  donationAmount: {
    type: Number,
    default: 0,
    min: [0, 'Donation must be non-negative']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const OrganizationSponsor = mongoose.model('OrganizationSponsor', organizationSponsorSchema);
const IndividualSponsor = mongoose.model('IndividualSponsor', individualSponsorSchema);

module.exports = {
  OrganizationSponsor,
  IndividualSponsor
};
