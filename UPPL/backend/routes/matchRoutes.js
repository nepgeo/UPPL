const express = require('express');
const router = express.Router();
const { protect, requireAdminOrSuperAdmin } = require('../middleware/authMiddleware');
const {
  createMatch,
  updateMatch,
  updateMatchResult,
  deleteMatch,
  getMatches,
  deleteMatchesBySeason,
} = require('../controllers/matchController');
const liveScoreController = require('../controllers/liveScoreController');
const prof = require('../controllers/professionalScoringController');

// Matches CRUD
router.post('/matches', protect, requireAdminOrSuperAdmin, createMatch);
router.put('/matches/:id', protect, requireAdminOrSuperAdmin, updateMatch);
router.patch('/matches/:id', protect, requireAdminOrSuperAdmin, updateMatch);
router.delete('/matches/:id', protect, requireAdminOrSuperAdmin, deleteMatch);
router.get('/matches', getMatches);
router.patch('/matches/:id/result', protect, requireAdminOrSuperAdmin, updateMatchResult);

// Live score: ball-by-ball events
router.post('/matches/:id/events', protect, requireAdminOrSuperAdmin, liveScoreController.addBall);

// Live score: getters (public)
router.get('/matches/:id/live-score', liveScoreController.getLiveScore);
router.get('/matches/live/now', liveScoreController.getLiveMatches);
router.get('/matches/recent/completed', liveScoreController.getRecentMatches);

// Admin undo
router.delete('/matches/:id/events/undo', protect, requireAdminOrSuperAdmin, liveScoreController.undoLastBall);

router.delete(
  '/matches/season/:seasonId',
  protect,
  requireAdminOrSuperAdmin,
  deleteMatchesBySeason
);

// ===== Professional Scoring Routes =====
// Playing XI
router.post('/matches/:matchId/playingXI', protect, requireAdminOrSuperAdmin, prof.setPlayingXI);
router.get('/matches/:matchId/playingXI', prof.getPlayingXI);

// Toss
router.post('/matches/:matchId/toss', protect, requireAdminOrSuperAdmin, prof.doMatchToss);

// Innings
router.post('/matches/:matchId/start-innings', protect, requireAdminOrSuperAdmin, prof.startInnings);
router.post('/matches/:matchId/end-innings', protect, requireAdminOrSuperAdmin, prof.endInnings);

// Ball scoring (new engine)
router.post('/matches/:matchId/score-ball', protect, requireAdminOrSuperAdmin, prof.scoreBall);

// Change bowler / batsman
router.post('/matches/:matchId/set-bowler', protect, requireAdminOrSuperAdmin, prof.setBowler);
router.post('/matches/:matchId/set-batsman', protect, requireAdminOrSuperAdmin, prof.setBatsman);

// Force-finish current over
router.post('/matches/:matchId/finish-over', protect, requireAdminOrSuperAdmin, prof.finishOver);

// Undo with recalculation
router.delete('/matches/:matchId/score-undo', protect, requireAdminOrSuperAdmin, prof.undoBall);

// Full scoring state
router.get('/matches/:matchId/scoring-state', protect, requireAdminOrSuperAdmin, prof.getScoringState);

module.exports = router;
