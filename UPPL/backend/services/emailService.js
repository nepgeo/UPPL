// backend/services/emailService.js

const nodemailer = require('nodemailer');

// ✅ Create the transporter once
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,             // SSL port
  secure: true,          // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address
    pass: process.env.EMAIL_PASS, // App Password (not your real Gmail password)
  },
});

// ✅ Verification Email Function
const sendVerificationEmail = async (email, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Player Verification Approved',
    text: `Hi ${name},\n\nYour player verification has been approved. Welcome to the team!`,
  };

  await transporter.sendMail(mailOptions);
};

// ✅ Rejection Email Function
const sendRejectionEmail = async (email, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Player Verification Rejected',
    text: `Hi ${name},\n\nWe regret to inform you that your player verification request has been rejected. You can still use the platform as a regular user.`,
  };

  await transporter.sendMail(mailOptions);
};

// ✅ Export both functions
module.exports = {
  sendVerificationEmail,
  sendRejectionEmail,
};
