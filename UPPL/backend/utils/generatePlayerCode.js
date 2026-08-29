const User = require('../models/User');

const generatePlayerCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    code = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit
    exists = await User.exists({ playerCode: code });
  }

  return code;
};

module.exports = generatePlayerCode;
