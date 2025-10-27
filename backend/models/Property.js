const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Property type is required'],
    enum: ['land', 'house', 'rental'],
    lowercase: true
  },
  title: {
    type: String,
    required: [true, 'Property title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Property description is required'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  surveyNumber: {
    type: String,
    required: [true, 'Survey number is required'],
    trim: true
  },
  location: {
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true
    },
    taluk: {
      type: String,
      required: [true, 'Taluk is required'],
      trim: true
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Full address is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^\d{6}$/, 'Please provide a valid 6-digit pincode']
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  squareFeet: {
    type: Number,
    required: [true, 'Square feet is required'],
    min: [1, 'Square feet must be greater than 0']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [1, 'Price must be greater than 0']
  },
  pricePerSqFt: {
    type: Number
  },
  ownerDetails: {
    name: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Owner phone is required'],
      match: [/^\+91[6-9]\d{9}$/, 'Please provide a valid Indian phone number']
    },
    email: {
      type: String,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    alternatePhone: {
      type: String,
      match: [/^\+91[6-9]\d{9}$/, 'Please provide a valid Indian phone number']
    }
  },
  features: {
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    parking: { type: Boolean, default: false },
    furnished: { 
      type: String, 
      enum: ['unfurnished', 'semi-furnished', 'fully-furnished'],
      default: 'unfurnished'
    },
    amenities: [String]
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: { type: Boolean, default: false }
  }],
  documents: [{
    type: String,
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  verificationStatus: {
    type: String,
    enum: ['pending_verification', 'verified', 'rejected'],
    default: 'pending_verification'
  },
  verificationDetails: {
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    verificationNotes: String,
    rejectionReason: String
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  contactRequests: {
    type: Number,
    default: 0
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

// Indexes for better performance
propertySchema.index({ type: 1 });
propertySchema.index({ verificationStatus: 1 });
propertySchema.index({ 'location.district': 1 });
propertySchema.index({ 'location.taluk': 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ squareFeet: 1 });
propertySchema.index({ uploadedBy: 1 });
propertySchema.index({ createdAt: -1 });

// Compound indexes
propertySchema.index({ type: 1, verificationStatus: 1 });
propertySchema.index({ 'location.district': 1, type: 1 });

// Calculate price per square feet before saving
propertySchema.pre('save', function(next) {
  if (this.price && this.squareFeet) {
    this.pricePerSqFt = Math.round(this.price / this.squareFeet);
  }
  this.updatedAt = Date.now();
  next();
});

// Static method to get verified properties
propertySchema.statics.getVerifiedProperties = function(filter = {}) {
  return this.find({ 
    verificationStatus: 'verified', 
    isActive: true,
    ...filter 
  }).populate('uploadedBy', 'name email phone');
};

// Static method to get properties by agent
propertySchema.statics.getAgentProperties = function(agentId) {
  return this.find({ uploadedBy: agentId })
    .populate('uploadedBy', 'name email')
    .populate('verificationDetails.verifiedBy', 'name');
};

// Instance method to increment views
propertySchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Instance method to increment contact requests
propertySchema.methods.incrementContactRequests = function() {
  this.contactRequests += 1;
  return this.save();
};

module.exports = mongoose.model('Property', propertySchema);