const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { protect, requireAdminOrSuperAdmin } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

const { upload } = require('../middleware/upload');

// 🔐 Protect ALL admin routes
router.use(protect);
router.use(isAdmin);
router.use(requireAdminOrSuperAdmin );

router.get('/users', adminController.getAllUsers);

// 📊 Admin Dashboard
router.get('/admin-dashboard', adminController.getAdminDashboardStats);

// 👥 Get paginated users
router.post('/users', adminController.createUser);
router.patch(
  '/users/:id',
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'documents', maxCount: 5 },
  ]),
  adminController.updateUser
);

router.delete('/users/:id', adminController.deleteUser);




// ✅ Approve Player (verify + role update + email)
router.patch('/verify-player/:playerId', adminController.verifyPlayer);

// ❌ Reject Player (downgrade + unverify + email)
router.patch('/reject-player/:playerId', adminController.rejectPlayer);

// 📤 Add Player/Team/Match
router.post('/players', adminController.addPlayer);
router.post('/teams', adminController.addTeam);
router.post('/matches', adminController.addMatch);

// 📋 Get Pending Players
router.get('/pending-players', requireAdminOrSuperAdmin, adminController.getPendingPlayers);

// 🔄 Reset stuck live matches from old seasons back to upcoming
const Match = require('../models/matchModel');
const Season = require('../models/seasonModel');

router.post('/cleanup-live-matches', async (req, res) => {
  try {
    const currentSeason = await Season.findOne({ isCurrent: true }).select('_id');
    let result;
    if (currentSeason) {
      result = await Match.updateMany(
        { result: 'live', seasonNumber: { $ne: currentSeason._id } },
        { $set: { result: 'upcoming' } }
      );
    } else {
      result = await Match.updateMany(
        { result: 'live' },
        { $set: { result: 'upcoming' } }
      );
    }
    res.json({
      success: true,
      message: `Reset ${result.modifiedCount} stuck live match(es) to upcoming`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
