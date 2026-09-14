const express = require('express');
const router = express.Router();

const { protect, requireAdminOrSuperAdmin } = require('../middleware/authMiddleware');
const groupController = require('../controllers/groupController');
const {
  generateLeagueMatches,
  deleteGroupsBySeason,
  deleteMatchesBySeason,
  getApprovedTeams,
  createGroup,
  updateGroup,
  deleteGroup,
} = require('../controllers/groupController');

// ✅ Generate groups manually for a season (admin only)
router.post(
  '/generate/:seasonId',
  protect,
  requireAdminOrSuperAdmin,
  groupController.generateGroups
);

// ✅ Admin can set schedule generation time manually
router.patch(
  '/schedule-time/:id',
  protect,
  requireAdminOrSuperAdmin,
  groupController.setScheduleTime
);

// ✅ Get schedule
router.get('/schedule', groupController.getSchedule);

// ✅ Generate league matches for a season
router.post(
  '/generate/league/:seasonId',
  protect,
  requireAdminOrSuperAdmin,
  generateLeagueMatches
);

// ✅ Delete all groups for a season
router.delete(
  '/season/:seasonId',
  protect,
  requireAdminOrSuperAdmin,
  deleteGroupsBySeason
);

// ✅ Delete all matches for a season
router.delete(
  '/matches/season/:seasonId',
  protect,
  requireAdminOrSuperAdmin,
  deleteMatchesBySeason
);

// ✅ Get approved teams for a season (with assignment info)
router.get(
  '/teams/approved',
  protect,
  requireAdminOrSuperAdmin,
  groupController.getApprovedTeams
);

// ✅ Create a new group (super-admin only)
router.post(
  '/:seasonId/groups',
  protect,
  requireAdminOrSuperAdmin,
  groupController.createGroup
);

// ✅ Update a group (rename, add/remove team)
router.put(
  '/:seasonId/groups/:groupName',
  protect,
  requireAdminOrSuperAdmin,
  groupController.updateGroup
);

// ✅ Delete a group
router.delete(
  '/:seasonId/groups/:groupName',
  protect,
  requireAdminOrSuperAdmin,
  groupController.deleteGroup
);

module.exports = router;
