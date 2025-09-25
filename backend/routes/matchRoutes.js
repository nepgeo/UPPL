const express = require('express');
const router = express.Router();
const { protect, requireAdminOrSuperAdmin } = require('../middleware/authMiddleware');
const {
  createMatch,
  updateMatch,
  updateMatchResult,
  deleteMatch,
  getMatches,
  deleteMatchesBySeason,   // ✅ add this
} = require('../controllers/matchController');
const liveScoreController = require('../controllers/liveScoreController');

// Matches CRUD
router.post('/matches', protect, requireAdminOrSuperAdmin, createMatch);
router.put('/matches/:id', protect, requireAdminOrSuperAdmin, updateMatch);
router.patch('/matches/:id', protect, requireAdminOrSuperAdmin, updateMatch);
router.delete('/matches/:id', protect, requireAdminOrSuperAdmin, deleteMatch);
router.get('/matches', getMatches);
router.patch('/matches/:id/result', protect, requireAdminOrSuperAdmin, updateMatchResult);

// Live score: add ball event
router.post('/matches/:id/events', protect, requireAdminOrSuperAdmin, liveScoreController.addBall);

// ✅ Delete all matches for a season
router.delete(
  '/matches/season/:seasonId',
  protect,
  requireAdminOrSuperAdmin,
  deleteMatchesBySeason
);

module.exports = router;
