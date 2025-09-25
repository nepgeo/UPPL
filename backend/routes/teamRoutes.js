// backend/routes/teamRoutes.js
const express = require('express');
const router = express.Router();

const teamController = require('../controllers/teamController');
const { protect, requireAdminOrSuperAdmin } = require('../middleware/authMiddleware');

// ✅ Correct destructuring from middleware/upload.js
const { upload, uploadTeamFiles } = require('../middleware/upload');

// Team registration route (for regular users)
router.post(
  '/',
  protect,
  upload.any(),

  // upload.fields([
  //   { name: 'teamLogo', maxCount: 1 },
  //   { name: 'paymentReceipt', maxCount: 1 }
  // ]),
  teamController.createTeam
);

router.get("/with-players", teamController.getTeamsWithPlayers);

// Admin-only routes
router.get('/', teamController.getTeamsBySeason);

router.get('/:id', teamController.getTeamById);

router.put(
  '/:id',
  protect,
  requireAdminOrSuperAdmin,
  upload.fields([
    { name: 'teamLogo', maxCount: 1 },
    { name: 'paymentReceipt', maxCount: 1 },
  ]),
  teamController.updateTeam
);

router.delete('/:id', protect, requireAdminOrSuperAdmin, teamController.deleteTeam);

router.patch('/:id/verify', protect, requireAdminOrSuperAdmin, teamController.verifyTeam);

router.patch('/:id/reject', protect, requireAdminOrSuperAdmin, teamController.rejectTeam);

module.exports = router;
