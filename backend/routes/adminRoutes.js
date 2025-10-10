const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { protect, requireAdminOrSuperAdmin } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

const { upload } = require('../middleware/upload');

router.get('/users', adminController.getAllUsers);
// 🔐 Apply middleware to all admin routes
router.use(protect);
router.use(isAdmin);
router.use(requireAdminOrSuperAdmin );

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

module.exports = router;
