
const crypto = require('crypto');
exports.generateSignature = ({ total_amount, transaction_uuid, product_code }) => {
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  const secret = process.env.ESEWA_SECRET_KEY;
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
};
