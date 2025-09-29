// controllers/sponsorController.js
const { OrganizationSponsor, IndividualSponsor } = require("../models/sponsorModel");
const { uploadFileToCloudinary, destroyPublicId } = require("../utils/cloudinaryService");

// ===============================
// Organization Sponsor Controllers
// ===============================

// Get all organizations
const getAllOrganizations = async (req, res) => {
  try {
    const sponsors = await OrganizationSponsor.find();
    res.json(sponsors);
  } catch (err) {
    console.error("❌ getAllOrganizations error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch organization sponsors" });
  }
};

// Create organization
const createOrganization = async (req, res) => {
  try {
    const { name, bio, donationAmount } = req.body;

    let logo = null;
    if (req.file) {
      const uploaded = await uploadFileToCloudinary(req.file.path, "sponsors/organizations");
      logo = { url: uploaded.url, public_id: uploaded.public_id };
    }

    const sponsor = new OrganizationSponsor({ name, bio, donationAmount, logo });
    await sponsor.save();

    res.status(201).json({ success: true, sponsor });
  } catch (err) {
    console.error("❌ Create Org Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create organization sponsor" });
  }
};

// Update organization
const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, donationAmount, isActive } = req.body;

    const sponsor = await OrganizationSponsor.findById(id);
    if (!sponsor) return res.status(404).json({ success: false, message: "Sponsor not found" });

    sponsor.name = name ?? sponsor.name;
    sponsor.bio = bio ?? sponsor.bio;
    sponsor.donationAmount = donationAmount ?? sponsor.donationAmount;
    sponsor.isActive = isActive ?? sponsor.isActive;

    if (req.file) {
      if (sponsor.logo?.public_id) {
        await destroyPublicId(sponsor.logo.public_id);
      }
      const uploaded = await uploadFileToCloudinary(req.file.path, "sponsors/organizations");
      sponsor.logo = { url: uploaded.url, public_id: uploaded.public_id };
    }

    await sponsor.save();
    res.json({ success: true, sponsor });
  } catch (error) {
    console.error("❌ Error updating organization sponsor:", error);
    res.status(500).json({ success: false, message: "Failed to update organization sponsor" });
  }
};

// Delete organization
const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const sponsor = await OrganizationSponsor.findById(id);
    if (!sponsor) return res.status(404).json({ success: false, message: "Sponsor not found" });

    if (sponsor.logo?.public_id) {
      await destroyPublicId(sponsor.logo.public_id);
    }

    await sponsor.deleteOne();
    res.json({ success: true, message: "Organization sponsor deleted", id });
  } catch (err) {
    console.error("❌ deleteOrganization error:", err);
    res.status(500).json({ success: false, message: "Failed to delete organization sponsor" });
  }
};

// ===============================
// Individual Sponsor Controllers
// ===============================

// Get all individuals
const getAllIndividuals = async (req, res) => {
  try {
    const sponsors = await IndividualSponsor.find();
    res.json(sponsors);
  } catch (err) {
    console.error("❌ getAllIndividuals error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch individual sponsors" });
  }
};

// Create individual
const createIndividual = async (req, res) => {
  try {
    const { name, bio, donationAmount } = req.body;

    let avatar = null;
    if (req.file) {
      const uploaded = await uploadFileToCloudinary(req.file.path, "sponsors/individuals");
      avatar = { url: uploaded.url, public_id: uploaded.public_id };
    }

    const sponsor = new IndividualSponsor({ name, bio, donationAmount, avatar });
    await sponsor.save();

    res.status(201).json({ success: true, sponsor });
  } catch (err) {
    console.error("❌ Create Individual Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create individual sponsor" });
  }
};

// Update individual
const updateIndividual = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, donationAmount } = req.body;

    const sponsor = await IndividualSponsor.findById(id);
    if (!sponsor) return res.status(404).json({ success: false, message: "Sponsor not found" });

    sponsor.name = name ?? sponsor.name;
    sponsor.bio = bio ?? sponsor.bio;
    sponsor.donationAmount = donationAmount ?? sponsor.donationAmount;

    if (req.file) {
      if (sponsor.avatar?.public_id) {
        await destroyPublicId(sponsor.avatar.public_id);
      }
      const uploaded = await uploadFileToCloudinary(req.file.path, "sponsors/individuals");
      sponsor.avatar = { url: uploaded.url, public_id: uploaded.public_id };
    }

    await sponsor.save();
    res.json({ success: true, sponsor });
  } catch (err) {
    console.error("❌ updateIndividual error:", err);
    res.status(500).json({ success: false, message: "Failed to update individual sponsor" });
  }
};

// Delete individual
const deleteIndividual = async (req, res) => {
  try {
    const { id } = req.params;
    const sponsor = await IndividualSponsor.findById(id);
    if (!sponsor) return res.status(404).json({ success: false, message: "Sponsor not found" });

    if (sponsor.avatar?.public_id) {
      await destroyPublicId(sponsor.avatar.public_id);
    }

    await sponsor.deleteOne();
    res.json({ success: true, message: "Individual sponsor deleted", id });
  } catch (err) {
    console.error("❌ deleteIndividual error:", err);
    res.status(500).json({ success: false, message: "Failed to delete individual sponsor" });
  }
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
