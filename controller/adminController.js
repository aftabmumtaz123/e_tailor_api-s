const Admin = require("../model/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const RefreshToken = require("../model/refreshToken");
const validator = require("validator");

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // 2. Validate environment variables
    if (!process.env.JWT_SECRET || !process.env.REFRESH_SECRET) {
      throw new Error("JWT_SECRET or REFRESH_SECRET not configured");
    }

    // 3. Normalize and find admin
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 5. Generate tokens
    const accessToken = jwt.sign(
      { id: admin._id, email: admin.email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { id: admin._id, email: admin.email, role: "admin" },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // 6. Save refresh token with synchronized expiry
    const decoded = jwt.decode(refreshToken);
    await RefreshToken.deleteMany({ userId: admin._id });
    await RefreshToken.create({
      token: refreshToken,
      userId: admin._id,
      expiresAt: new Date(decoded.exp * 1000),
    });

    // 7. Set cookies securely
    const isSecure = req.protocol === "https" || process.env.NODE_ENV === "production";
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 8. Response
    return res.json({
      success: true,
      message: "Login successful",
      data: { id: admin._id, name: admin.name, email: admin.email, role: "admin" },
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    let message = "Server error during login";
    if (error.name === "MongoError") {
      message = "Database error occurred";
    } else if (error.name === "JsonWebTokenError") {
      message = "Token generation failed";
    }
    return res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};