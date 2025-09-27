const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const RefreshToken = require("../model/refreshToken");
const Admin = require("../model/admin");

const verifyJwt = promisify(jwt.verify);

const authMiddleware = async (req, res, next) => {
  try {
    // Extract tokens
    let accessToken =
      req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.cookies.access_token;

    const refreshToken = req.cookies.refresh_token;

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "No access token provided. Please log in.",
      });
    }

    let decoded;
    try {
      // Verify access token
      decoded = await verifyJwt(accessToken, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      if (err.name !== "TokenExpiredError") {
        return res.status(403).json({ success: false, message: "Invalid access token." });
      }
    }

    // --- If access token expired, try refresh token ---
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    }

    let decodedRefresh;
    try {
      decodedRefresh = await verifyJwt(refreshToken, process.env.REFRESH_SECRET);
    } catch {
      return res.status(403).json({ success: false, message: "Invalid refresh token. Please log in again." });
    }

    // Check refresh token in DB
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      userId: decodedRefresh.id,
    });

    if (!storedToken || storedToken.expiresAt < Date.now()) {
      return res.status(403).json({ success: false, message: "Refresh token expired or revoked. Please log in again." });
    }

    // Ensure admin still exists
    const admin = await Admin.findById(decodedRefresh.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin no longer exists." });
    }

    // Issue new access token
    const newAccessToken = jwt.sign(
      { id: admin._id, email: admin.email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    req.user = { id: admin._id, email: admin.email, role: "admin" };
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = authMiddleware;
