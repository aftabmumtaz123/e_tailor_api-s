const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    announcementImage: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    publishDate: {
      type: Date,
      required: [true, "Publish date is required"],
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
      
    },
    sendTo: {
      type: String,
      enum: {
        values: ["All", "Specific"],
        message: "{VALUE} is not a valid sendTo option",
      },
      required: [true, "SendTo is required"],
      index: true, // Add index for filtering
    },
    status: {
      type: String,
      enum:{
        values: ["Active", "Inactive"],
        message: "{VALUE} is not a valid status",
        },
      default: "Active",
      index: true, // Add index for filtering
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);