const axios = require('axios');

const ESEWA_VERIFY_URL = 'https://uat.esewa.com.np/epay/transrec';

const verifyEsewaPayment = async ({ refId, pid, amt }) => {
  try {
    const response = await axios.post(ESEWA_VERIFY_URL, null, {
      params: {
        amt,
        scd: 'EPAYTEST',
        pid,
        rid: refId,
      },
    });

    const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

    return {
      verified: responseText.includes('Success'),
      refId,
      response: responseText,
    };
  } catch (error) {
    console.error('eSewa verification failed:', error.message);
    return { verified: false, refId, error: error.message };
  }
};

module.exports = { verifyEsewaPayment };
