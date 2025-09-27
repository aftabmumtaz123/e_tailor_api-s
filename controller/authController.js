const Tailor = require("../model/tailor");
const Admin = require("../model/admin");   // ✅ Use Admin here
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const RefreshToken = require("../model/refreshToken");

// -------------------- Register Tailor --------------------
exports.register = async (req, res) => {
  try {
    const { shopName, ownerName, phone, subscriptionPlan, category, status, email, password, address } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const logo = req.file?.path || req.file?.secure_url || "";

    // Check if tailor already exists
    const isTailor = await Tailor.findOne({ email });
    if (isTailor) {
      return res.status(400).json({ status: false, message: "Tailor already exists" });
    }
    //check phone number
    const isPhone = await Tailor.findOne({ phone });
    if (isPhone) {
      return res.status(400).json({ status: false, message: "Phone number already exists" });
    }

    const tailor = new Tailor({
      shopName,
      ownerName,
      phone,
      subscriptionPlan,
      logo,
      category,
      status,
      email,
      address,
      password: hashedPassword,
    });

    await tailor.save();
    console.log("✅ Tailor registered:", tailor);

    // Return safe object without password
    const safeTailor = tailor.toObject();
    delete safeTailor.password;

    res.status(201).json({ success: true, msg: "Successfully registered tailor", tailor: safeTailor });
  } catch (e) {
    console.error("❌ Register error:", e);
    res.status(400).json({ status: false, message: e.message });
  }
};

// -------------------- Refresh Token (Admin only) --------------------
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      return res.status(403).json({ status: false, message: "Invalid refresh token" });
    }

    jwt.verify(refreshToken, process.env.REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ status: false, message: "Refresh token expired or invalid" });
      }

      // ✅ Only admins can refresh
      const admin = await Admin.findById(decoded.id);
      if (!admin) {
        return res.status(403).json({ status: false, message: "Admin not found" });
      }

      const newAccessToken = jwt.sign(
        { id: admin._id, email: admin.email, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      const newRefreshToken = jwt.sign(
        { id: admin._id, email: admin.email, role: "admin" },
        process.env.REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      // Update refresh token in DB
      storedToken.token = newRefreshToken;
      storedToken.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await storedToken.save();

      res.cookie("access_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.cookie("refresh_token", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.json({
        status: true,
        message: "Token refreshed",
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    });
  } catch (err) {
    console.error("❌ Refresh error:", err);
    res.status(500).json({ status: false, message: "Internal server error during refresh" });
  }
};

// -------------------- Logout (Admin only) --------------------
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    return res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("❌ Logout error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
