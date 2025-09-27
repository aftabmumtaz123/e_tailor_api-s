const mongoose = require("mongoose");
const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,         
      trim: true,              
    },
    email: {
      type: String,
      required: true,
      unique: true,            
      lowercase: true,         
      trim: true,
      match: [/.+\@.+\..+/, "Please enter a valid email"], 
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10,15}$/, "Please enter a valid phone number"], 
    },
    total_orders: {
      type: Number,
      default: 0,
      min: 0,                  
    },
    last_order: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "banned"], 
      default: "active",
    },
  },
  { timestamps: true } 
);

module.exports = mongoose.model("Customer", customerSchema);
