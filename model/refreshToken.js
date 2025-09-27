const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  expiresAt: { type: Date, required: true }
});

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
