const mongoose = require('mongoose');


const appConfigurationSchema = new mongoose.Schema({
  appName: {
    type: String,
    required: true,
    trim: true,
  },
  appLogo: {
    type: String, 
    trim: true,
  },
  primaryColor: {
    type: String, 
    required: true,
    trim: true,
  },
  secondaryColor: {
    type: String, 
    required: true,
    trim: true,
  },
  aboutUs: {
    type: String,
    trim: true,
  },
  contactEmails: {
    type: [String],
    trim: true,
   
  },
  supportPhones: {
    type: [String],
    trim: true,
    
  },
  
  facebook: { type: String, trim: true },
  twitter: { type: String, trim: true },
  instagram: { type: String, trim: true },
  youtube: { type: String, trim: true },
  linkedin: { type: String, trim: true },
  lastUpdated: {
    type: String, 
    trim: true,
    default: new Date().toISOString(),
  },
}, { timestamps: true }); 

module.exports = mongoose.model('AppConfiguration', appConfigurationSchema);