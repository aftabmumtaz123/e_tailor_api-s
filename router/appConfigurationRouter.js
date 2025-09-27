const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const authMiddleware = require('../middleware/auth');

const {
//   createAppConfiguration,
  updateAppConfiguration,
  getAppConfigurationById
} = require("../controller/appConfigurationController");

// Create new configuration
// router.post("/set", authMiddleware, upload.single("appLogo"), createAppConfiguration);

// Update configuration
router.put("/set/:id", upload.single("appLogo"), updateAppConfiguration);

// Get configuration (no file upload needed)
router.get("/get/:id", getAppConfigurationById);

module.exports = router;
