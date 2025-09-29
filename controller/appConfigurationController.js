const Configuration = require("../model/app_configuration");
const cloudinary = require("cloudinary").v2;

const mongoose = require('mongoose');

exports.createAppConfiguration = async (req, res) => {
  try {
    // Debug: Log the incoming request body and file
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);

    // Check if req.body is undefined
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing',
      });
    }

    const {
      appName,
      primaryColor,
      secondaryColor,
      facebook,
      aboutUs,
      contactEmails,
      supportPhones,
      instagram,
      youtube,
      linkedin,
    } = req.body;
    const appLogo = req.file ? req.file.path : ''; // Use appLogo to match schema

    // Validate required fields
    if (!appName || !primaryColor || !secondaryColor) {
      return res.status(400).json({
        success: false,
        message: 'appName, primaryColor, and secondaryColor are required',
      });
    }

    // Validate color formats (hex or rgb)
    const validateColor = (color) => /^#([0-9A-F]{3}|[0-9A-F]{6})|rgb\(\d{1,3}%?,\s*\d{1,3}%?,\s*\d{1,3}%?\)$/.test(color.toLowerCase());
    if (!validateColor(primaryColor)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid primaryColor format (e.g., #FF0000 or rgba(43, 32, 32, 1))',
      });
    }
    if (!validateColor(secondaryColor)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid secondaryColor format (e.g., #123456 or rgba(49, 38, 48, 1))',
      });
    }

    // Validate social fields as URLs if provided
    const validateUrl = (url) => url ? /^https?:\/\/.+/.test(url) : true;
    if (!validateUrl(facebook) || !validateUrl(instagram) || !validateUrl(youtube) || !validateUrl(linkedin)) {
      return res.status(400).json({
        success: false,
        message: 'Social links must be valid URLs if provided',
      });
    }

    // Validate arrays if provided
    if (contactEmails && !Array.isArray(contactEmails)) {
      return res.status(400).json({
        success: false,
        message: 'contactEmails must be an array',
      });
    }
    if (supportPhones && !Array.isArray(supportPhones)) {
      return res.status(400).json({
        success: false,
        message: 'supportPhones must be an array',
      });
    }

    // Check for duplicate appName
    const existingConfig = await Configuration.findOne({ appName });
    if (existingConfig) {
      return res.status(400).json({
        success: false,
        message: 'Configuration with this appName already exists',
      });
    }

    // Create configuration with defaults
    const configuration = await Configuration.create({
      appName,
      appLogo,
      primaryColor,
      secondaryColor,
      aboutUs: aboutUs || '',
      contactEmails: contactEmails || [],
      supportPhones: supportPhones || [],
      facebook: facebook || '',
      instagram: instagram || '',
      youtube: youtube || '',
      linkedin: linkedin || '',
    });

    console.log('Configuration created:', configuration);
    res.status(201).json({
      success: true,
      message: 'Configuration created successfully',
      configuration,
    });
  } catch (error) {
    // Handle Cloudinary file cleanup on error with error catching
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename).catch(err => console.error('Cloudinary cleanup failed:', err));
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    } else if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate key error (e.g., appName already exists)',
      });
    } else {
      console.error('Error creating configuration:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

exports.getAppConfigurationById = async (req, res) => {
  try {
    const { id } = req.params; // e.g., /configuration/get/:id

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid configuration ID",
      });
    }

    // Find configuration
    const configuration = await Configuration.findById(id).lean(); 
    // .lean() returns a plain JS object (faster, no mongoose overhead if no methods needed)

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: "Configuration not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Configuration fetched successfully",
      configuration,
    });
  } catch (error) {
    console.error("Error fetching configuration:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message, // include error for debugging in dev
    });
  }
};



exports.updateAppConfiguration = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid configuration ID",
      });
    }

    // Destructure fields from body
    const {
      appName,
      primaryColor,
      secondaryColor,
      aboutUs,
      contactEmails,
      supportPhones,
      facebook,
      instagram,
      youtube,
      linkedin,
    } = req.body;

    // Get new logo if uploaded
    const appLogo = req.file ? req.file.path : undefined;

    // Find existing configuration
    const existingConfig = await Configuration.findById(id);
    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        message: "Configuration not found",
      });
    }

    // Prevent empty required fields
    if (
      appName === "" ||
      primaryColor === "" ||
      secondaryColor === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "appName, primaryColor, and secondaryColor cannot be empty",
      });
    }

    // Validate color formats (if provided)
    const validateColor = (color) =>
      color
        ? /^#([0-9A-F]{3}|[0-9A-F]{6})$|^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/.test(
            color.toLowerCase()
          )
        : true;

    if (primaryColor && !validateColor(primaryColor)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid primaryColor format (use #RRGGBB or rgb(r,g,b))",
      });
    }
    if (secondaryColor && !validateColor(secondaryColor)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid secondaryColor format (use #RRGGBB or rgb(r,g,b))",
      });
    }

    // Arrays validation
    if (contactEmails && !Array.isArray(contactEmails)) {
      return res.status(400).json({
        success: false,
        message: "contactEmails must be an array",
      });
    }
    if (supportPhones && !Array.isArray(supportPhones)) {
      return res.status(400).json({
        success: false,
        message: "supportPhones must be an array",
      });
    }

    // Check duplicate appName
    if (appName && appName !== existingConfig.appName) {
      const duplicateConfig = await Configuration.findOne({ appName });
      if (duplicateConfig) {
        return res.status(400).json({
          success: false,
          message:
            "Configuration with this appName already exists",
        });
      }
    }

    // Build update data
    const updateData = {
      appName: appName ?? existingConfig.appName,
      primaryColor: primaryColor ?? existingConfig.primaryColor,
      secondaryColor: secondaryColor ?? existingConfig.secondaryColor,
      aboutUs: aboutUs ?? existingConfig.aboutUs,
      contactEmails: contactEmails ?? existingConfig.contactEmails,
      supportPhones: supportPhones ?? existingConfig.supportPhones,
      facebook: facebook ?? existingConfig.facebook,
      instagram: instagram ?? existingConfig.instagram,
      youtube: youtube ?? existingConfig.youtube,
      linkedin: linkedin ?? existingConfig.linkedin,
    };

    // Handle logo update
    if (appLogo) {
      if (existingConfig.appLogo) {
        const publicId = existingConfig.appLogo
          .split("/")
          .pop()
          .split(".")[0];
        await cloudinary.uploader
          .destroy(publicId)
          .catch((err) =>
            console.error("Failed to delete old logo:", err)
          );
      }
      updateData.appLogo = appLogo;
    }

    // Update configuration
    const updatedConfig = await Configuration.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Configuration updated successfully",
      configuration: updatedConfig,
    });
  } catch (error) {
    console.error("Error updating configuration:", error);

    if (req.file?.filename) {
      await cloudinary.uploader
        .destroy(req.file.filename)
        .catch((err) =>
          console.error("Cloudinary cleanup failed:", err)
        );
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
