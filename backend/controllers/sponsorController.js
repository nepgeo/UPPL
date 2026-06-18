const { OrganizationSponsor, IndividualSponsor } = require("../models/sponsorModel");
const { uploadFileToCloudinary, destroyPublicId } = require("../utils/cloudinaryService");

const TIER_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

// ===============================
// Helpers
// ===============================
const buildSort = (query) => {
  if (query.sortBy === "donation") {
    return { donationAmount: query.sortDir === "asc" ? 1 : -1 };
  }
  return { displayOrder: 1, createdAt: -1 };
};

const buildUpdateFields = (body, isOrg) => {
  const fields = {};
  ["name", "bio", "donationAmount", "isActive", "tier", "displayOrder"].forEach(k => {
    if (body[k] !== undefined) fields[k] = k === "donationAmount" || k === "displayOrder" ? Number(body[k]) : body[k];
  });
  if (isOrg) {
    ["website", "email", "phone"].forEach(k => {
      if (body[k] !== undefined) fields[k] = body[k];
    });
  }
  return fields;
};

// ===============================
// Organization Sponsor
// ===============================

const getAllOrganizations = async (req, res) => {
  try {
    const sponsors = await OrganizationSponsor.find().sort(buildSort(req.query));
    res.json(sponsors);
  } catch (err) {
    console.error("getAllOrganizations error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch organization sponsors" });
  }
};

const createOrganization = async (req, res) => {
  try {
    const { name, bio, donationAmount, isActive, tier, displayOrder, website, email, phone } = req.body;

    let logo = null;
    if (req.file) {
      const uploaded = await uploadFileToCloudinary(req.file.path, "sponsors/organizations");
      logo = { url: uploaded.url, public_id: uploaded.public_id };
    }

    const sponsor = new OrganizationSponsor({
      name, bio, donationAmount: Number(donationAmount || 0),
      isActive: isActive === "true" || isActive === true,
      tier: tier || "bronze", displayOrder: Number(displayOrder || 0),
      website, email, phone, logo,
    });
    await sponsor.save();
    res.status(201).json({ success: true, sponsor });
  } catch (err) {
    console.error("Create Org Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create organization sponsor" });
  }
};

const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const sponsor = await OrganizationSponsor.findById(id);
    if (!sponsor) return res.status(404).json({ success: false, message: "Sponsor not found" });

    const fields = buildUpdateFields(req.body, true);
    Object.assign(sponsor, fields);

    if (req.file) {
      if (sponsor.logo?.public_id) await destroyPublicId(sponsor.logo.public_id);
      const uploaded = await uploadFileToCloudinary(req.file.path, "sponsors/organizations");
      sponsor.logo = { url: uploaded.url, public_id: uploaded.public_id };
    }

    await sponsor.save();
    res.json({ success: true, sponsor });
  } catch (error) {
    console.error("Error updating organization sponsor:", error);
    res.status(500).json({ success: false, message: "Failed to update organization sponsor" });
  }
};

const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const sponsor = await OrganizationSponsor.findById(id);
    if (!sponsor) return res.status(404).json({ success: false, message: "Sponsor not found" });
    if (sponsor.logo?.public_id) await destroyPublicId(sponsor.logo.public_id);
    await sponsor.deleteOne();
    res.json({ success: true, message: "Organization sponsor deleted" });
  } catch (err) {
    console.error("deleteOrganization error:", err);
    res.status(500).json({ success: false, message: "Failed to delete organization sponsor" });
  }
};

// ===============================
// Individual Sponsor
// ===============================

const getAllIndividuals = async (req, res) => {
  try {
    const sponsors = await IndividualSponsor.find().sort(buildSort(req.query));
    res.json(sponsors);
  } catch (err) {
    console.error("getAllIndividuals error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch individual sponsors" });
  }
};

const createIndividual = async (req, res) => {
  try {
    const { name, bio, donationAmount, isActive, tier, displayOrder } = req.body;

    let avatar = null;
    if (req.file) {
      const uploaded = await uploadFileToCloudinary(req.file.path, "sponsors/individuals");
      avatar = { url: uploaded.url, public_id: uploaded.public_id };
    }

    const sponsor = new IndividualSponsor({
      name, bio, donationAmount: Number(donationAmount || 0),
      isActive: isActive === "true" || isActive === true,
      tier: tier || "bronze", displayOrder: Number(displayOrder || 0),
      avatar,
    });
    await sponsor.save();
    res.status(201).json({ success: true, sponsor });
  } catch (err) {
    console.error("Create Individual Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create individual sponsor" });
  }
};

const updateIndividual = async (req, res) => {
  try {
    const { id } = req.params;
    const sponsor = await IndividualSponsor.findById(id);
    if (!sponsor) return res.status(404).json({ success: false, message: "Sponsor not found" });

    const fields = buildUpdateFields(req.body, false);
    Object.assign(sponsor, fields);

    if (req.file) {
      if (sponsor.avatar?.public_id) await destroyPublicId(sponsor.avatar.public_id);
      const uploaded = await uploadFileToCloudinary(req.file.path, "sponsors/individuals");
      sponsor.avatar = { url: uploaded.url, public_id: uploaded.public_id };
    }

    await sponsor.save();
    res.json({ success: true, sponsor });
  } catch (err) {
    console.error("updateIndividual error:", err);
    res.status(500).json({ success: false, message: "Failed to update individual sponsor" });
  }
};

const deleteIndividual = async (req, res) => {
  try {
    const { id } = req.params;
    const sponsor = await IndividualSponsor.findById(id);
    if (!sponsor) return res.status(404).json({ success: false, message: "Sponsor not found" });
    if (sponsor.avatar?.public_id) await destroyPublicId(sponsor.avatar.public_id);
    await sponsor.deleteOne();
    res.json({ success: true, message: "Individual sponsor deleted" });
  } catch (err) {
    console.error("deleteIndividual error:", err);
    res.status(500).json({ success: false, message: "Failed to delete individual sponsor" });
  }
};

// ===============================
// Bulk toggle active
// ===============================

const bulkToggleActive = async (req, res) => {
  try {
    const { ids, isActive, type } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ message: "ids array is required" });
    }
    const Model = type === "organization" ? OrganizationSponsor : IndividualSponsor;
    const result = await Model.updateMany(
      { _id: { $in: ids } },
      { $set: { isActive: isActive === true || isActive === "true" } }
    );
    res.json({ modified: result.modifiedCount });
  } catch (err) {
    console.error("bulkToggleActive error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllOrganizations, createOrganization, updateOrganization, deleteOrganization,
  getAllIndividuals, createIndividual, updateIndividual, deleteIndividual,
  bulkToggleActive,
};
