const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.purpose !== 'email_verification';
    }
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: function() {
      return this.purpose === 'property_contact';
    }
  },
  // Phone for WhatsApp/SMS OTP
  phone: {
    type: String,
    required: function() {
      return ['property_contact', 'phone_verification'].includes(this.purpose);
    },
    match: [/^\+91[6-9]\d{9}$/, 'Please provide a valid Indian phone number']
  },
  // Email for email OTP verification
  email: {
    type: String,
    required: function() {
      return this.purpose === 'email_verification';
    },
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  // User data for registration verification
  userData: {
    name: String,
    role: String,
    phone: String
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  purpose: {
    type: String,
    enum: ['property_contact', 'phone_verification', 'password_reset', 'email_verification'],
    default: 'property_contact'
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  expiryTime: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  verifiedAt: Date,
  ipAddress: String,
  userAgent: String
});

// Index for faster queries and automatic cleanup
otpSchema.index({ userId: 1, propertyId: 1 });
otpSchema.index({ phone: 1 });
otpSchema.index({ email: 1 });
otpSchema.index({ purpose: 1 });
otpSchema.index({ expiryTime: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired documents
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // Auto-delete after 1 hour

// Static method to generate OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Instance method to check if OTP is valid
otpSchema.methods.isValidOTP = function(inputOTP) {
  return (
    this.otp === inputOTP &&
    !this.isUsed &&
    !this.isExpired &&
    this.expiryTime > new Date() &&
    this.attempts < 3
  );
};

// Instance method to mark OTP as used
otpSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  this.verifiedAt = new Date();
  return this.save();
};

// Instance method to increment attempts
otpSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  if (this.attempts >= 3) {
    this.isExpired = true;
  }
  return this.save();
};

// Pre-save middleware to check expiry
otpSchema.pre('save', function(next) {
  if (this.expiryTime <= new Date()) {
    this.isExpired = true;
  }
  next();
});

module.exports = mongoose.model('OTP', otpSchema);