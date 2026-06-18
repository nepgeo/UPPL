const Team = require('../models/teamModel');
const { verifyEsewaPayment } = require('../services/paymentService');

const verifyEsewa = async (req, res) => {
  try {
    const { refId, pid, amt, teamId } = req.body;

    if (!refId || !pid || !amt) {
      return res.status(400).json({ verified: false, message: 'Missing required payment parameters' });
    }

    const result = await verifyEsewaPayment({ refId, pid, amt });

    if (!result.verified) {
      return res.json({ verified: false, message: 'eSewa payment verification failed' });
    }

    if (teamId) {
      const team = await Team.findByIdAndUpdate(
        teamId,
        {
          status: 'pending',
          'paymentReceipt.url': `esewa:${refId}`,
          'paymentReceipt.public_id': `esewa:${refId}`,
        },
        { new: true }
      );

      if (!team) {
        return res.status(404).json({ verified: true, message: 'Payment verified but team not found' });
      }
    }

    res.json({ verified: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ verified: false, message: 'Verification failed', error: error.message });
  }
};

module.exports = { verifyEsewa };
