// /backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');
const User = require('../models/User');
const bcrypt = require("bcryptjs");


router.use(protect);
router.patch(
  "/users/:id",
  upload.single("profileImage"),
  userController.updateUser
);

router.patch("/:id/change-password", userController.changePassword);



// router.patch('/:id/change-password', async (req, res) => {
//   const { oldPassword, newPassword } = req.body;

//   try {
//     const user = await User.findById(req.params.id);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const match = await bcrypt.compare(oldPassword.trim(), user.password);
//     if (!match) return res.status(400).json({ message: 'Old password incorrect' });

//     // ✅ Trim new password before hashing
//     const trimmedNewPassword = newPassword.trim();
//     user.password = await bcrypt.hash(trimmedNewPassword, 10);
//     await user.save();

//     res.json({ message: 'Password updated' });
//   } catch (err) {
//     console.error('Change password route error:', err);
//     res.status(500).json({ message: 'Internal Server Error', error: err.message });
//   }
// });




router.post('/predict', userController.castPrediction);
router.post('/vote', userController.castVote);

module.exports = router;