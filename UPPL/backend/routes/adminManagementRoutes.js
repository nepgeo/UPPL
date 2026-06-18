const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const { getAdminDashboardStats } = require('../controllers/adminController');

// Super Admin only route
router.post('/create-admin', protect, requireRole(['super-admin']), async (req, res) => {
  // Create admin logic here
  res.json({ message: 'Admin created successfully (example)' });
});

router.get(
  '/admin-dashboard',
  protect,
  requireRole(['admin', 'super-admin']),
  getAdminDashboardStats
);
// Admin and Super Admin access
// router.get('/admin-dashboard', protect, requireRole(['admin', 'super-admin']), (req, res) => {
//   res.json({ message: `Welcome to admin dashboard, ${req.user.role}` });
// });

// router.get('/admin-dashboard', protect, requireRole(['admin', 'super-admin']), getAdminDashboardStats);


module.exports = router;
