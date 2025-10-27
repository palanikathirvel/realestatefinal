const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'user_register',
      'user_login',
      'user_logout',
      'property_upload',
      'property_edit',
      'property_delete',
      'property_view',
      'otp_request',
      'otp_verify',
      'property_verification',
      'property_reject',
      'user_block',
      'user_unblock',
      'contact_request',
      'profile_update',
      'password_change',
      'api_access',
      'unauthorized_access',
      'unauthorized_property_access'
    ]
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  details: {
    type: String,
    maxlength: [500, 'Details cannot be more than 500 characters']
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    browser: String,
    device: String,
    location: {
      country: String,
      state: String,
      city: String
    },
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  category: {
    type: String,
    enum: ['auth', 'property', 'admin', 'security', 'otp', 'user_action'],
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
});

// Indexes for better performance
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ action: 1 });
activitySchema.index({ category: 1 });
activitySchema.index({ severity: 1 });
activitySchema.index({ timestamp: -1 });
activitySchema.index({ propertyId: 1 });

// Compound indexes
activitySchema.index({ userId: 1, action: 1 });
activitySchema.index({ category: 1, timestamp: -1 });

// Auto-delete activities older than 6 months
activitySchema.index({ timestamp: 1 }, { 
  expireAfterSeconds: 6 * 30 * 24 * 60 * 60 // 6 months in seconds
});

// Static method to log activity
activitySchema.statics.logActivity = async function(activityData) {
  try {
    const activity = new this(activityData);
    return await activity.save();
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
};

// Static method to get user activities
activitySchema.statics.getUserActivities = function(userId, limit = 50) {
  return this.find({ userId })
    .populate('propertyId', 'title type location.district')
    .populate('targetUserId', 'name email')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get admin dashboard activities
activitySchema.statics.getAdminActivities = function(filter = {}, limit = 100) {
  return this.find(filter)
    .populate('userId', 'name email role')
    .populate('propertyId', 'title type')
    .populate('targetUserId', 'name email')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get activities by category
activitySchema.statics.getActivitiesByCategory = function(category, limit = 50) {
  return this.find({ category })
    .populate('userId', 'name email role')
    .populate('propertyId', 'title type')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get security alerts
activitySchema.statics.getSecurityAlerts = function(limit = 20) {
  return this.find({ 
    $or: [
      { severity: { $in: ['high', 'critical'] } },
      { category: 'security' },
      { status: 'failed' }
    ]
  })
    .populate('userId', 'name email role')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Instance method to format activity for display
activitySchema.methods.getFormattedActivity = function() {
  return {
    id: this._id,
    action: this.action,
    user: this.userId,
    details: this.details,
    timestamp: this.timestamp,
    severity: this.severity,
    category: this.category,
    status: this.status,
    property: this.propertyId,
    target: this.targetUserId
  };
};

module.exports = mongoose.model('Activity', activitySchema);