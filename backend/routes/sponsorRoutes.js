// sponsorRoutes.js
const express = require('express');
const router = express.Router();

const {
  getAllOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getAllIndividuals,
  createIndividual,
  updateIndividual,
  deleteIndividual
} = require('../controllers/sponsorController');

const { protect, requireAdminOrSuperAdmin } = require('../middleware/authMiddleware');
const {upload} = require('../middleware/upload');

// ================================
// Organization sponsor routes
// ================================
router.get('/organizations', getAllOrganizations);

router.post(
  '/organizations',
  protect,
  requireAdminOrSuperAdmin,
  upload.single('logo'), // ⬅ expects form field: logo
  createOrganization
);

router.put(
  '/organizations/:id',
  protect,
  requireAdminOrSuperAdmin,
  upload.single('logo'), // ⬅ Add this for PUT too
  updateOrganization
);

router.delete('/organizations/:id', protect, requireAdminOrSuperAdmin, deleteOrganization);

// ================================
// Individual sponsor routes
// ================================
router.get('/individuals', getAllIndividuals);

router.post(
  '/individuals',
  protect,
  requireAdminOrSuperAdmin,
  upload.single('avatar'), // ⬅ expects form field: avatar
  createIndividual
);

router.put(
  '/individuals/:id',
  protect,
  requireAdminOrSuperAdmin,
  upload.single('avatar'), // ⬅ Add this for PUT too
  updateIndividual
);

router.delete('/individuals/:id', protect, requireAdminOrSuperAdmin, deleteIndividual);

module.exports = router;
