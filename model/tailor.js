const mongoose = require("mongoose");

const tailorSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
      minlength: [2, "Shop name must be at least 2 characters"],
      maxlength: [100, "Shop name cannot exceed 100 characters"],
    },
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
      minlength: [2, "Owner name must be at least 2 characters"],
      maxlength: [50, "Owner name cannot exceed 50 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      unique: true,
      trim: true,
      match: [/^\+?\d{10,15}$/, "Phone must be 10-15 digits"],
      index: true, // Add index for lookups
    },
    subscriptionPlan: {
      type: String,
      enum: {
        values: ["Basic", "Premium", "Enterprise"],
        message: "{VALUE} is not a valid subscription plan",
      },
      default: "Basic",
    },
    logo: {
      type: String,
      trim: true,
 
    },
    category: {
      type: String,
      enum: {
        values: ["Men", "Women", "Both"],
        message: "{VALUE} is not a valid category",
      },
      default: "Both",
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["Active", "Inactive"],
        message: "{VALUE} is not a valid status",
      },
      default: "Active",
      index: true, // Add index for filtering
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
      index: true, // Add index for lookups
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },
    announcements: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Announcement",
      },
    ],
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        validate: {
          validator: async function (id) {
            const order = await mongoose.model("Order").findById(id);
            return !!order;
          },
          message: "Invalid order ID",
        },
      },
    ],
  },
  { timestamps: true }
);
module.exports = mongoose.model("Tailor", tailorSchema);