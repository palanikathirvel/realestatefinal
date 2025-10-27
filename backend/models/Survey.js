const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
  surveyNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  district: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  taluk: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  valid: {
    type: Boolean,
    default: true,
    index: true
  },
  area: {
    type: Number, // in square feet
    required: false
  },
  landType: {
    type: String,
    enum: ['agricultural', 'residential', 'commercial', 'industrial', 'vacant'],
    default: 'residential'
  },
  ownerDetails: {
    name: String,
    documentNumber: String
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastVerified: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'disputed', 'transferred', 'cancelled'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for fast lookups
surveySchema.index({ 
  surveyNumber: 1, 
  district: 1, 
  taluk: 1 
});

// Text index for search functionality
surveySchema.index({
  surveyNumber: 'text',
  district: 'text',
  taluk: 'text'
});

// Update the updatedAt field before saving
surveySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to verify survey number with location
surveySchema.statics.verifySurveyWithLocation = async function(surveyNumber, district, taluk) {
  try {
    const survey = await this.findOne({
      surveyNumber: { $regex: new RegExp(`^${surveyNumber}$`, 'i') },
      district: { $regex: new RegExp(`^${district}$`, 'i') },
      taluk: { $regex: new RegExp(`^${taluk}$`, 'i') },
      valid: true,
      status: 'active'
    });

    return survey;
  } catch (error) {
    console.error('Survey verification error:', error);
    throw error;
  }
};

// Static method to get survey by number only
surveySchema.statics.findBySurveyNumber = async function(surveyNumber) {
  try {
    const survey = await this.findOne({
      surveyNumber: { $regex: new RegExp(`^${surveyNumber}$`, 'i') },
      valid: true,
      status: 'active'
    });

    return survey;
  } catch (error) {
    console.error('Survey lookup error:', error);
    throw error;
  }
};

// Static method to get all surveys by district
surveySchema.statics.getSurveysByDistrict = async function(district, limit = 50) {
  try {
    const surveys = await this.find({
      district: { $regex: new RegExp(district, 'i') },
      valid: true,
      status: 'active'
    })
    .select('surveyNumber district taluk landType')
    .limit(limit)
    .sort({ surveyNumber: 1 });

    return surveys;
  } catch (error) {
    console.error('District surveys lookup error:', error);
    throw error;
  }
};

// Instance method to format survey info
surveySchema.methods.getFormattedInfo = function() {
  return {
    surveyNumber: this.surveyNumber,
    location: `${this.district}, ${this.taluk}`,
    landType: this.landType,
    status: this.status,
    area: this.area,
    lastVerified: this.lastVerified
  };
};

module.exports = mongoose.model('Survey', surveySchema);