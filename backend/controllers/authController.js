const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Player = require("../models/Player"); 
const generatePlayerCode = require("../utils/generatePlayerCode");
const mailer = require("../config/mailer");
const generateOtp = require("../utils/generateOtp");
const transporter = require("../config/mailer");
const crypto = require("crypto");
const cloudinary = require("../config/cloudinary"); // ✅ add

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
 * @desc    Register a new user (with Cloudinary upload support)
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
      return res.status(403).json({ message: "Cannot create super-admin accounts" });
    }

    // ✅ Check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already taken" });
    }

    // ✅ Upload profile image to Cloudinary
    let profileImage = null;
    if (req.files?.profileImage?.[0]) {
      const uploadRes = await cloudinary.uploader.upload(
        req.files.profileImage[0].path,
        { folder: "users/profile" }
      );
      profileImage = { url: uploadRes.secure_url, public_id: uploadRes.public_id };
    }

    // ✅ Upload documents to Cloudinary
    let documents = [];
    if (req.files?.documents?.length > 0) {
      for (const file of req.files.documents) {
        const uploadRes = await cloudinary.uploader.upload(file.path, {
          folder: "users/documents",
        });
        documents.push({ url: uploadRes.secure_url, public_id: uploadRes.public_id });
      }
    }

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
        return res.status(500).json({ message: "Error generating player code" });
      }
    }

    // ✅ Save the new user
    await newUser.save();

    // ✅ Generate JWT
    const token = generateToken(newUser);

    // ✅ Respond with Cloudinary URLs
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
