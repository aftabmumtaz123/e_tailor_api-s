const mongoose = require("mongoose");

const userLoginSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Refers to the User collection
      required: true,
    },
    loginTime: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String, // Store device/browser info
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserLogin", userLoginSchema);
