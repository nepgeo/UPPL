const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Player = require("../models/Player"); 
const generatePlayerCode = require("../utils/generatePlayerCode");
const mailer = require("../config/mailer");
const generateOtp = require("../utils/generateOtp");
const transporter = require("../config/mailer");
const crypto = require("crypto");
const { uploadFileToCloudinary, destroyPublicId } = require("../utils/cloudinaryService");
/**
 * Helper: Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

/**
 * @desc    Register a new user (direct Cloudinary storage)
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

    if (role === "super-admin") {
      return res
        .status(403)
        .json({ message: "Cannot create super-admin accounts" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already taken" });
    }

    // ✅ Cloudinary: profileImage
    let profileImage = null;
    if (req.files?.profileImage?.[0]) {
      const uploaded = await uploadFileToCloudinary(
        req.files.profileImage[0].path,
        "users/profile"
      );
      profileImage = { url: uploaded.url, public_id: uploaded.public_id };
    }

    // ✅ Cloudinary: documents
    let documents = [];
    if (req.files?.documents?.length > 0) {
      for (const file of req.files.documents) {
        const uploaded = await uploadFileToCloudinary(
          file.path,
          "users/documents"
        );
        documents.push({ url: uploaded.url, public_id: uploaded.public_id });
      }
    }

    // ✅ Hash password
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
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

    await newUser.save();
    const token = generateToken(newUser);

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
        team: newUser.team || null,
        profileImage: newUser.profileImage || null,
        documents: newUser.documents || [],
      },
    });
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    res.status(500).json({ message: "Error registering user" });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(
      (password || "").trim(),
      user.password
    );
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    if (user.role === "player" && !user.verified) {
      return res
        .status(403)
        .json({ message: "Your account is pending admin verification." });
    }

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        playerCode: user.playerCode || null,
        team: user.team || null,
        profileImage: user.profileImage || null,
        documents: user.documents || [],
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Error logging in" });
  }
};

/**
 * @desc    Forgot Password (send OTP)
 * @route   POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "No account is registered with this email." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.resetOtpAttempts = 0;
    user.resetOtpLockedUntil = null;
    await user.save();

    const mailOptions = {
      from: `"UPPL" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your password reset OTP",
      text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Error sending OTP" });
  }
};

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

