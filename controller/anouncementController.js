const mongoose = require("mongoose");
const Announcement = require("../model/announcement");

const VALID_STATUSES = ["active", "inactive"];

// ================= GET ANNOUNCEMENTS =================
exports.getAnnouncement = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status && VALID_STATUSES.includes(status.toLowerCase())) {
      query.status = status.toLowerCase();
    }

    const totalAnnouncements = await Announcement.countDocuments(query);

    const announcements = await Announcement.find(query)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    if (announcements.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No announcements found",
        announcements: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Announcements fetched successfully",
      announcements,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalAnnouncements / Number(limit)),
        totalAnnouncements,
        hasNextPage: Number(page) < Math.ceil(totalAnnouncements / Number(limit)),
        hasPrevPage: Number(page) > 1,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching announcements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================= CREATE ANNOUNCEMENT =================
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, publishDate, expiryDate, sendTo, status } = req.body;
    const announcementImage = req.file ? req.file.path : "";

    // Required field validation
    if (!title || !message || !status) {
      return res.status(400).json({
        success: false,
        message: "Title, message, and status are required",
      });
    }

    // Status validation
    if (!VALID_STATUSES.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }



    // Date validations
    if (publishDate && isNaN(Date.parse(publishDate))) {
      return res.status(400).json({ success: false, message: "Invalid publishDate format" });
    }
    if (expiryDate && isNaN(Date.parse(expiryDate))) {
      return res.status(400).json({ success: false, message: "Invalid expiryDate format" });
    }
    if (publishDate && expiryDate && new Date(expiryDate) <= new Date(publishDate)) {
      return res.status(400).json({
        success: false,
        message: "expiryDate must be after publishDate",
      });
    }

    // Unique title check (case-insensitive)
    const checkAnnouncement = await Announcement.findOne({
      title: { $regex: new RegExp("^" + title + "$", "i") },
    });
    if (checkAnnouncement) {
      return res.status(400).json({
        success: false,
        message: "Announcement with this title already exists",
      });
    }

    const announcement = await Announcement.create({
      title,
      announcementImage,
      message,
      publishDate,
      expiryDate,
      sendTo,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement,
    });
  } catch (e) {
    console.error("❌ Error creating announcement:", e);
    res.status(500).json({
      success: false,
      message: "Failed to create announcement",
      error: process.env.NODE_ENV === "development" ? e.message : undefined,
    });
  }
};

// ================= DELETE ANNOUNCEMENT =================
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid announcement ID" });
    }

    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
      announcement,
    });
  } catch (error) {
    console.error("❌ Error deleting announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
