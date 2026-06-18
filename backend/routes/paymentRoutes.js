const express = require('express');
const router = express.Router();
const { verifyEsewa } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/verify-esewa', protect, verifyEsewa);

module.exports = router;
