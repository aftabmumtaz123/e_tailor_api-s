const Admin = require("../model/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const RefreshToken = require("../model/refreshToken");

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

    // 2. Normalize email (avoid case mismatch issues)
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password", // Do NOT reveal which one failed
      });
    }

    // 3. Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password", // Generic message
      });
    }

    // 4. Generate tokens
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

    // 5. Remove old refresh tokens (optional but safer)
    await RefreshToken.deleteMany({ userId: admin._id });

    // 6. Save new refresh token
    await RefreshToken.create({
      token: refreshToken,
      userId: admin._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // 7. Set cookies securely
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 8. Response
    return res.json({
      success: true,
      message: "Login successful",
      data: { id: admin._id, name: admin.name, email: admin.email, role: "admin" },
      tokens: { accessToken, refreshToken },
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
