// utils/generateOtp.js
const crypto = require('crypto');

module.exports = function generateOtp(len = 6) {
  // crypto-random 6-digit number (100000–999999)
  const min = 10 ** (len - 1);
  const max = (10 ** len) - 1;
  return crypto.randomInt(min, max + 1).toString();
};
