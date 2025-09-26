const { OrganizationSponsor, IndividualSponsor } = require('../models/sponsorModel');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary'); // ✅ Cloudinary config

// ===============================
// Organization Sponsor Controllers
// ===============================

const getAllOrganizations = async (req, res) => {
  try {
    const sponsors = await OrganizationSponsor.find();
    res.json(sponsors);
  } catch (err) {
    console.error("Fetch organizations error:", err.message);
    res.status(500).json({ message: "Failed to fetch organizations" });
  }
};

const createOrganization = async (req, res) => {
  try {
    const { name, bio, donationAmount } = req.body;
    let logo = null;
    let logoId = null;

    if (req.file) {
      const uploadPath = path.join(__dirname, "..", req.file.path);

      const uploadRes = await cloudinary.uploader.upload(uploadPath, {
        folder: "sponsors",
      });

      logo = uploadRes.secure_url;
      logoId = uploadRes.public_id;

      fs.unlinkSync(uploadPath); // ✅ delete local file
    }

    const sponsor = new OrganizationSponsor({
      name,
      bio,
      donationAmount,
      logo,
      logoId,
    });

    await sponsor.save();
    res.status(201).json(sponsor);
  } catch (err) {
    console.error("Create Org Error:", err.message);
    res.status(500).json({ message: "Failed to create organization sponsor" });
  }
};

const updateOrganization = async (req, res) => {
  try {
    const { name, bio, donationAmount, isActive } = req.body;

    const sponsor = await OrganizationSponsor.findById(req.params.id);
    if (!sponsor) return res.status(404).json({ error: "Sponsor not found" });

    if (req.file) {
      // ✅ remove old logo if exists
      if (sponsor.logoId) {
        await cloudinary.uploader.destroy(sponsor.logoId);
      }

      const uploadPath = path.join(__dirname, "..", req.file.path);
      const uploadRes = await cloudinary.uploader.upload(uploadPath, {
        folder: "sponsors",
      });

      sponsor.logo = uploadRes.secure_url;
      sponsor.logoId = uploadRes.public_id;

      fs.unlinkSync(uploadPath);
    }

    sponsor.name = name || sponsor.name;
    sponsor.bio = bio || sponsor.bio;
    sponsor.donationAmount = donationAmount || sponsor.donationAmount;
    sponsor.isActive = isActive ?? sponsor.isActive;

    await sponsor.save();
    res.json(sponsor);
  } catch (error) {
    console.error("Error updating organization sponsor:", error);
    res.status(500).json({ error: "Server error while updating organization sponsor" });
  }
};

const deleteOrganization = async (req, res) => {
  try {
    const sponsor = await OrganizationSponsor.findById(req.params.id);
    if (!sponsor) return res.status(404).json({ message: "Sponsor not found" });

    if (sponsor.logoId) {
      await cloudinary.uploader.destroy(sponsor.logoId); // ✅ remove from cloudinary
    }

    await sponsor.deleteOne();
    res.json({ message: "Organization sponsor deleted" });
  } catch (err) {
    console.error("Delete Org Error:", err.message);
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
    console.error("Fetch individuals error:", err.message);
    res.status(500).json({ message: "Failed to fetch individuals" });
  }
};

const createIndividual = async (req, res) => {
  try {
    const { name, bio, donationAmount } = req.body;
    let avatar = null;
    let avatarId = null;

    if (req.file) {
      const uploadPath = path.join(__dirname, "..", req.file.path);

      const uploadRes = await cloudinary.uploader.upload(uploadPath, {
        folder: "sponsors",
      });

      avatar = uploadRes.secure_url;
      avatarId = uploadRes.public_id;

      fs.unlinkSync(uploadPath);
    }

    const sponsor = new IndividualSponsor({
      name,
      bio,
      donationAmount,
      avatar,
      avatarId,
    });

    await sponsor.save();
    res.status(201).json(sponsor);
  } catch (err) {
    console.error("Create Individual Error:", err.message);
    res.status(500).json({ message: "Failed to create individual sponsor" });
  }
};

const updateIndividual = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, donationAmount } = req.body;

    const sponsor = await IndividualSponsor.findById(id);
    if (!sponsor) return res.status(404).json({ message: "Sponsor not found" });

    if (req.file) {
      if (sponsor.avatarId) {
        await cloudinary.uploader.destroy(sponsor.avatarId);
      }

      const uploadPath = path.join(__dirname, "..", req.file.path);
      const uploadRes = await cloudinary.uploader.upload(uploadPath, {
        folder: "sponsors",
      });

      sponsor.avatar = uploadRes.secure_url;
      sponsor.avatarId = uploadRes.public_id;

      fs.unlinkSync(uploadPath);
    }

    sponsor.name = name || sponsor.name;
    sponsor.bio = bio || sponsor.bio;
    sponsor.donationAmount = donationAmount || sponsor.donationAmount;

    await sponsor.save();
    res.json(sponsor);
  } catch (err) {
    console.error("Update Individual Error:", err.message);
    res.status(500).json({ message: "Failed to update individual sponsor" });
  }
};

const deleteIndividual = async (req, res) => {
  try {
    const sponsor = await IndividualSponsor.findById(req.params.id);
    if (!sponsor) return res.status(404).json({ message: "Sponsor not found" });

    if (sponsor.avatarId) {
      await cloudinary.uploader.destroy(sponsor.avatarId);
    }

    await sponsor.deleteOne();
    res.json({ message: "Individual sponsor deleted" });
  } catch (err) {
    console.error("Delete Individual Error:", err.message);
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
