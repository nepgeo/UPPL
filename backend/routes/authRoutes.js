const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {upload} = require('../middleware/upload'); // 👈 Multer middleware
// Register route with image and document upload
router.post(
  '/register',
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'documents', maxCount: 10 }
  ]),
  authController.register
);

router.post('/login', authController.login);


router.post('/forgot-password', authController.forgotPassword);
router.post('/forgot-password/verify', authController.verifyResetOtp);   // optional
router.post('/forgot-password/resend', authController.resendResetOtp);   // optional
router.post('/reset-password', authController.resetPasswordWithOtp);



module.exports = router;
