const { OrganizationSponsor, IndividualSponsor } = require('../models/sponsorModel');
const fs = require('fs');
const path = require('path');

// ===============================
// Organization Sponsor Controllers
// ===============================

const getAllOrganizations = async (req, res) => {
  const sponsors = await OrganizationSponsor.find();
  res.json(sponsors);
};

const createOrganization = async (req, res) => {
  try {
    const { name, bio, donationAmount } = req.body;

    const logo = req.file ? `/uploads/sponsors/${req.file.filename}` : null;

    const sponsor = new OrganizationSponsor({
      name,
      bio,
      donationAmount,
      logo,
    });

    await sponsor.save();
    res.status(201).json(sponsor);
  } catch (err) {
    console.error('Create Org Error:', err.message);
    res.status(500).json({ message: 'Failed to create organization sponsor' });
  }
};

const updateOrganization = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Missing form data' });
    }

    const { name, bio, donationAmount, isActive } = req.body;

    const updatedFields = {
      name,
      bio,
      donationAmount,
      isActive,
    };

    if (req.file) {
      updatedFields.logo = `/uploads/sponsors/${req.file.filename}`;
    }

    const sponsor = await OrganizationSponsor.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true }
    );

    if (!sponsor) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }

    res.json(sponsor);
  } catch (error) {
    console.error("Error updating organization sponsor:", error);
    res.status(500).json({ error: 'Server error while updating organization sponsor' });
  }
};

const deleteOrganization = async (req, res) => {
  const { id } = req.params;
  const sponsor = await OrganizationSponsor.findById(id);

  if (!sponsor) return res.status(404).json({ message: 'Sponsor not found' });

  // Delete logo image
  if (sponsor.logo) {
    const logoPath = path.join(__dirname, '..', sponsor.logo);
    fs.unlink(logoPath, (err) => {
      if (err) console.warn('Failed to delete logo:', err.message);
    });
  }

  await sponsor.deleteOne();
  res.json({ message: 'Organization sponsor deleted' });
};

// ===============================
// Individual Sponsor Controllers
// ===============================

const getAllIndividuals = async (req, res) => {
  const sponsors = await IndividualSponsor.find();
  res.json(sponsors);
};

const createIndividual = async (req, res) => {
  try {
    const { name, bio, donationAmount } = req.body;

    const avatar = req.file ? `/uploads/sponsors/${req.file.filename}` : null;

    const sponsor = new IndividualSponsor({
      name,
      bio,
      donationAmount,
      avatar,
    });

    await sponsor.save();
    res.status(201).json(sponsor);
  } catch (err) {
    console.error('Create Individual Error:', err.message);
    res.status(500).json({ message: 'Failed to create individual sponsor' });
  }
};

const updateIndividual = async (req, res) => {
  const { id } = req.params;
  const { name, bio, donationAmount } = req.body;

  const updatedFields = { name, bio, donationAmount };

  if (req.file) {
    updatedFields.avatar = `/uploads/sponsors/${req.file.filename}`;
  }

  const updatedSponsor = await IndividualSponsor.findByIdAndUpdate(id, updatedFields, { new: true });
  res.json(updatedSponsor);
};

const deleteIndividual = async (req, res) => {
  const { id } = req.params;
  const sponsor = await IndividualSponsor.findById(id);

  if (!sponsor) return res.status(404).json({ message: 'Sponsor not found' });

  // Delete avatar image
  if (sponsor.avatar) {
    const avatarPath = path.join(__dirname, '..', sponsor.avatar);
    fs.unlink(avatarPath, (err) => {
      if (err) console.warn('Failed to delete avatar:', err.message);
    });
  }

  await sponsor.deleteOne();
  res.json({ message: 'Individual sponsor deleted' });
};

// ===============================
// Exports
// ===============================

module.exports = {
  getAllOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getAllIndividuals,
  createIndividual,
  updateIndividual,
  deleteIndividual,
};
