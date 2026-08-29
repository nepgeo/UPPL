const express = require('express');
const {
  getAllTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} = require('../controllers/teamMemberController');
const { upload } = require('../middleware/upload'); // ✅ Import your multer config

const router = express.Router();

/**
 * TEAM ROUTES
 * Base: /api/team
 */

// Get all team members
router.get('/', getAllTeam);

// Create new team member (with image upload)
router.post(
  '/',
  upload.single('teamMember'), // ✅ field name must match frontend FormData
  createTeamMember
);

// Update team member
router.put(
  '/:id',
  upload.single('teamMember'),
  updateTeamMember
);

// Delete team member
router.delete('/:id', deleteTeamMember);

module.exports = router;
