const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Player = require("../models/Player"); // 🧩 Needed for login check
const generatePlayerCode = require('../utils/generatePlayerCode'); // ✅ Make sure this path is correct
const mailer = require('../config/mailer');                 // <-- add
const generateOtp = require('../utils/generateOtp');   
const transporter = require("../config/mailer");
const crypto = require("crypto");     // <-- add


/**
 * Helper: Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" } // 1 day expiry
  );
};

/**
 * @desc    Start password reset (send OTP)
 * @route   POST /api/auth/forgot-password
 * @body    { email }
 */

/**
 * @desc    Register a new user (with file upload support)
 * @route   POST /api/auth/register
 * @access  Public
 */


exports.register = async (req, res) => {
  try {
    console.log("📦 Incoming req.body:", req.body);
    console.log("📎 Incoming req.files:", req.files);

    const {
      name,
      email,
      password,
      role,
      position,
      battingStyle,
      bowlingStyle,
      phone,
      bio,
      dateOfBirth,
    } = req.body;

    // ❌ Prevent super-admin registration
    if (role === "super-admin") {
      return res
        .status(403)
        .json({ message: "Cannot create super-admin accounts" });
    }

    // ✅ Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already taken" });
    }

    // ✅ Handle profile image (if uploaded)
    let profileImage = "";
    if (req.files?.profileImage?.[0]) {
      profileImage = req.files.profileImage[0].path;
    }

    // ✅ Handle multiple documents
    const documents = req.files?.documents?.map((file) => file.path) || [];

    // ✅ Create new user object
    const newUser = new User({
      name,
      email,
      password,
      role: role || "user",
      position,
      battingStyle,
      bowlingStyle,
      phone,
      bio,
      dateOfBirth,
      profileImage,
      documents,
    });

    // ✅ If player, set verified = false and generate playerCode
    if (newUser.role === "player") {
      newUser.verified = false;

      try {
        newUser.playerCode = await generatePlayerCode();
      } catch (err) {
        console.error("❌ Failed to generate player code:", err.message);
        return res
          .status(500)
          .json({ message: "Error generating player code" });
      }
    }

    // ✅ Save the new user
    await newUser.save();

    // ✅ Generate JWT
    const token = generateToken(newUser);

    // ✅ Respond (include profileImage and documents as public /uploads URLs)
    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        verified: newUser.verified,
        playerCode: newUser.playerCode || null,
        team: newUser.team || null, // 👈 useful later
        profileImage: newUser.profileImage
          ? `/uploads/${newUser.profileImage.replace(/\\/g, "/")}`
          : null,
        documents: newUser.documents
          ? newUser.documents.map((doc) =>
              `/uploads/${doc.replace(/\\/g, "/")}`
            )
          : [],
      },
    });
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    res.status(500).json({ message: "Error registering user" });
  }
};

/**
 * @desc    Login user and return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  console.log("\n=== LOGIN REQUEST ===");
  console.log("Incoming request:", req.body);

  try {
    // ✅ Find user by email
    const user = await User.findOne({ email });
    console.log("User found in DB:", user ? user.toObject() : null);
    console.log("Incoming email:", email);
    console.log("Incoming password raw:", JSON.stringify(password));

    if (!user) {
      console.log("❌ No user found");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Compare password
    const isMatch = await bcrypt.compare((password || '').trim(), user.password);
    console.log("Password match:", isMatch);
    if (!isMatch) {
      console.log("❌ Password does not match");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🛑 Player must be verified to log in
    if (user.role === "player" && !user.verified) {
      return res.status(403).json({ message: "Your account is pending admin verification." });
    }

    // ✅ Generate token
    const token = generateToken(user);

    // ✅ Set cookie (important for cross-site: Vercel → Render)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true on Render
      sameSite: "none", // allow from Vercel frontend
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // ✅ Always return profileImage, documents, etc.
    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        profileImage: user.profileImage || null,
        documents: user.documents || [],
        playerCode: user.playerCode || null,
      },
    });

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};


/**
 * @desc    Start password reset (send OTP)
 * @route   POST /api/auth/forgot-password
 * @body    { email }
 */
// controllers/authController.js


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Don’t leak existence info
      return res.json({ message: "No account is registered with this email address." });
    }

    // ✅ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ Save OTP + expiry in DB
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry ⏰
    user.resetOtpAttempts = 0;
    user.resetOtpLockedUntil = null;
    await user.save();

    console.log("📩 Forgot Password OTP Generated:", {
      email,
      otp,
      expires: user.resetOtpExpires,
    });

    // ✅ Build email
    const mailOptions = {
      from: `"Udaydev Patan Premier League" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your password reset OTP",
      text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color:#4F46E5;">Password Reset Request</h2>
          <p>Hi ${user.name || "User"},</p>
          <p>Your OTP for resetting your password is:</p>
          <p style="font-size: 22px; font-weight: bold; color:#EF4444;">${otp}</p>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn’t request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    // ✅ Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Error sending OTP", error: error.message });
  }
};



/**
 * @desc    Verify OTP (optional step for UX)
 * @route   POST /api/auth/forgot-password/verify
 * @body    { email, otp }
 */
// controllers/authController.js

exports.verifyResetOtp = async (req, res) => {
  const { email = '', otp = '' } = req.body;

  try {
    console.log("📩 VERIFY OTP REQUEST:", { email, otp }); // Debug log

    const user = await User.findOne({ email: email.trim() });

    if (!user) {
      console.warn("⚠️ No user found with email:", email);
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    console.log("🗄️ DB OTP INFO:", {
      storedOtp: user.resetOtp,
      expires: user.resetOtpExpires,
      now: new Date(),
    });

    if (!user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Lock check
    if (user.resetOtpLockedUntil && user.resetOtpLockedUntil > new Date()) {
      return res.status(429).json({ message: 'Too many attempts. Try again later.' });
    }

    // Expiry check
    if (new Date() > user.resetOtpExpires) {
      user.resetOtp = undefined;
      user.resetOtpExpires = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    // Compare OTP
    if (otp.trim() !== user.resetOtp) {
      user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;

      if (user.resetOtpAttempts >= 5) {
        user.resetOtpLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.resetOtpAttempts = 0;
      }

      await user.save();
      console.warn("❌ Wrong OTP entered for:", email);
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // Success → clear attempts
    user.resetOtpAttempts = 0;
    await user.save();

    console.log("✅ OTP verified successfully for:", email);

    return res.json({ message: 'OTP verified. You can now reset your password.' });
  } catch (err) {
    console.error('🔥 Verify OTP error:', err);
    return res.status(500).json({ message: 'Server error while verifying OTP.' });
  }
};



/**
 * @desc    Resend OTP (regenerate)
 * @route   POST /api/auth/forgot-password/resend
 * @body    { email }
 */
exports.resendResetOtp = async (req, res) => {
  const { email = '' } = req.body;

  const genericMsg = 'If an account exists, a new OTP has been emailed.';

  try {
    const user = await User.findOne({ email: email.trim() });
    if (!user) return res.status(200).json({ message: genericMsg });

    // Basic cooldown: don’t resend too frequently (e.g., 60s)
    if (user.resetOtpExpires && user.resetOtpExpires - Date.now() > 9.5 * 60 * 1000) {
      // Means they just requested a new OTP (expires was just set)
      return res.status(429).json({ message: 'Please wait a moment before requesting again.' });
    }

    const otp = generateOtp(6);
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.resetOtpAttempts = 0;
    user.resetOtpLockedUntil = undefined;
    await user.save();

    try {
      const info = await mailer.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Your new password reset OTP',
        text: `Your new OTP is: ${otp}\nIt will expire in 10 minutes.`,
      });
      console.log('✅ Resent OTP email:', info.messageId || info.response);
    } catch (err) {
      console.error('❌ Resend OTP email error:', err);
    }

    return res.status(200).json({ message: genericMsg });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(200).json({ message: genericMsg });
  }
};


/**
 * @desc    Reset password with OTP
 * @route   POST /api/auth/reset-password
 * @body    { email, otp, newPassword }
 */
exports.resetPasswordWithOtp = async (req, res) => {
  const { email = '', otp = '', newPassword = '' } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const user = await User.findOne({ email: email.trim() });
    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Lock check
    if (user.resetOtpLockedUntil && user.resetOtpLockedUntil > new Date()) {
      return res.status(429).json({ message: 'Too many attempts. Try again later.' });
    }

    // Expiry
    if (new Date() > user.resetOtpExpires) {
      user.resetOtp = undefined;
      user.resetOtpExpires = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    // Compare OTP
    if (otp.trim() !== user.resetOtp) {
      user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
      if (user.resetOtpAttempts >= 5) {
        user.resetOtpLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.resetOtpAttempts = 0;
      }
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // Set new password (your pre-save hook will hash it)
    user.password = newPassword.trim();

    // Clear OTP fields
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    user.resetOtpLockedUntil = undefined;

    await user.save();

    return res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Failed to reset password.' });
  }
};
