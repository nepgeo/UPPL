// controllers/sponsorController.js
const { OrganizationSponsor, IndividualSponsor } = require('../models/sponsorModel');
const cloudinary = require('../config/cloudinary'); // ✅ use Cloudinary

// ===============================
// Organization Sponsor Controllers
// ===============================

const getAllOrganizations = async (req, res) => {
  try {
    const sponsors = await OrganizationSponsor.find();
    res.json(sponsors);
  } catch (err) {
    console.error("❌ getAllOrganizations error:", err);
    res.status(500).json({ message: "Failed to fetch organization sponsors" });
  }
};

const createOrganization = async (req, res) => {
  try {
    const { name, bio, donationAmount } = req.body;

    let logo = null;
    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: "sponsors/organizations",
        public_id: `org-${Date.now()}`,
      });
      logo = { url: uploadRes.secure_url, public_id: uploadRes.public_id };
    }

    const sponsor = new OrganizationSponsor({
      name,
      bio,
      donationAmount,
      logo,
    });

    await sponsor.save();
    res.status(201).json(sponsor);
  } catch (err) {
    console.error("❌ Create Org Error:", err.message);
    res.status(500).json({ message: "Failed to create organization sponsor" });
  }
};

const updateOrganization = async (req, res) => {
  try {
    const { name, bio, donationAmount, isActive } = req.body;

    const sponsor = await OrganizationSponsor.findById(req.params.id);
    if (!sponsor) return res.status(404).json({ error: "Sponsor not found" });

    sponsor.name = name ?? sponsor.name;
    sponsor.bio = bio ?? sponsor.bio;
    sponsor.donationAmount = donationAmount ?? sponsor.donationAmount;
    sponsor.isActive = isActive ?? sponsor.isActive;

    if (req.file) {
      // Delete old logo if exists
      if (sponsor.logo?.public_id) {
        await cloudinary.uploader.destroy(sponsor.logo.public_id);
      }
      // Upload new
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: "sponsors/organizations",
        public_id: `org-${Date.now()}`,
      });
      sponsor.logo = { url: uploadRes.secure_url, public_id: uploadRes.public_id };
    }

    await sponsor.save();
    res.json(sponsor);
  } catch (error) {
    console.error("❌ Error updating organization sponsor:", error);
    res.status(500).json({ error: "Server error while updating organization sponsor" });
  }
};

const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const sponsor = await OrganizationSponsor.findById(id);
    if (!sponsor) return res.status(404).json({ message: "Sponsor not found" });

    if (sponsor.logo?.public_id) {
      await cloudinary.uploader.destroy(sponsor.logo.public_id);
    }

    await sponsor.deleteOne();
    res.json({ message: "Organization sponsor deleted" });
  } catch (err) {
    console.error("❌ deleteOrganization error:", err);
    res.status(500).json({ message: "Failed to delete organization sponsor" });
  }
};

// ===============================
// Individual Sponsor Controllers
// ===============================

const getAllIndividuals = async (req, res) => {
  try {
    const sponsors = await IndividualSponsor.find();
    res.json(sponsors);
  } catch (err) {
    console.error("❌ getAllIndividuals error:", err);
    res.status(500).json({ message: "Failed to fetch individual sponsors" });
  }
};

const createIndividual = async (req, res) => {
  try {
    const { name, bio, donationAmount } = req.body;

    let avatar = null;
    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: "sponsors/individuals",
        public_id: `ind-${Date.now()}`,
      });
      avatar = { url: uploadRes.secure_url, public_id: uploadRes.public_id };
    }

    const sponsor = new IndividualSponsor({
      name,
      bio,
      donationAmount,
      avatar,
    });

    await sponsor.save();
    res.status(201).json(sponsor);
  } catch (err) {
    console.error("❌ Create Individual Error:", err.message);
    res.status(500).json({ message: "Failed to create individual sponsor" });
  }
};

const updateIndividual = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, donationAmount } = req.body;

    const sponsor = await IndividualSponsor.findById(id);
    if (!sponsor) return res.status(404).json({ message: "Sponsor not found" });

    sponsor.name = name ?? sponsor.name;
    sponsor.bio = bio ?? sponsor.bio;
    sponsor.donationAmount = donationAmount ?? sponsor.donationAmount;

    if (req.file) {
      // Delete old avatar if exists
      if (sponsor.avatar?.public_id) {
        await cloudinary.uploader.destroy(sponsor.avatar.public_id);
      }
      // Upload new
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: "sponsors/individuals",
        public_id: `ind-${Date.now()}`,
      });
      sponsor.avatar = { url: uploadRes.secure_url, public_id: uploadRes.public_id };
    }

    await sponsor.save();
    res.json(sponsor);
  } catch (err) {
    console.error("❌ updateIndividual error:", err);
    res.status(500).json({ message: "Failed to update individual sponsor" });
  }
};

const deleteIndividual = async (req, res) => {
  try {
    const { id } = req.params;
    const sponsor = await IndividualSponsor.findById(id);
    if (!sponsor) return res.status(404).json({ message: "Sponsor not found" });

    if (sponsor.avatar?.public_id) {
      await cloudinary.uploader.destroy(sponsor.avatar.public_id);
    }

    await sponsor.deleteOne();
    res.json({ message: "Individual sponsor deleted" });
  } catch (err) {
    console.error("❌ deleteIndividual error:", err);
    res.status(500).json({ message: "Failed to delete individual sponsor" });
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
