const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Notification type
  type: {
    type: String,
    enum: ['contact_owner', 'property_update', 'system_alert', 'user_action', 'message'],
    default: 'contact_owner',
    required: true
  },

  // Who initiated the action (user who clicked Contact Owner)
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Who should receive the notification (agent or admin)
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Related property
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },

  // Notification title
  title: {
    type: String,
    required: true,
    trim: true
  },

  // Notification message/description
  message: {
    type: String,
    required: true,
    trim: true
  },

  // Additional metadata
  metadata: {
    userEmail: String,
    userName: String,
    agentName: String,
    propertyTitle: String,
    contactViewedAt: Date,
    userPhone: String,
    messageId: mongoose.Schema.Types.ObjectId,
    senderName: String,
    senderEmail: String
  },

  // Notification status
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },

  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // When the notification was read
  readAt: {
    type: Date,
    default: null
  },

  // When the notification expires (optional)
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // This adds createdAt and updatedAt
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ property: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

// Static methods
notificationSchema.statics.createContactOwnerNotification = async function(data) {
  const { userId, agentId, propertyId, userEmail, userName, agentName, propertyTitle } = data;

  // Create notification for agent
  const agentNotification = new this({
    type: 'contact_owner',
    initiator: userId,
    recipient: agentId,
    property: propertyId,
    title: `Contact Request from ${userName}`,
    message: `User ${userName} viewed your contact details. Did you receive any call from ${userName}?`,
    metadata: {
      userEmail,
      userName,
      agentName,
      propertyTitle,
      contactViewedAt: new Date()
    },
    priority: 'high'
  });

  return await agentNotification.save();
};

notificationSchema.statics.createAdminNotification = async function(data) {
  const { userId, agentId, adminId, propertyId, userEmail, userName, agentName, propertyTitle } = data;

  // Create notification for admin
  const adminNotification = new this({
    type: 'contact_owner',
    initiator: userId,
    recipient: adminId,
    property: propertyId,
    title: `User Contact Activity`,
    message: `User ${userName} contacted agent ${agentName}`,
    metadata: {
      userEmail,
      userName,
      agentName,
      propertyTitle,
      contactViewedAt: new Date()
    },
    priority: 'medium'
  });

  return await adminNotification.save();
};

notificationSchema.statics.createMessageNotification = async function(data) {
  const { senderId, recipientId, propertyId, messageId, senderName, senderEmail, propertyTitle, messageText } = data;

  // Create notification for recipient (agent)
  const messageNotification = new this({
    type: 'message',
    initiator: senderId,
    recipient: recipientId,
    property: propertyId,
    title: `New Message from ${senderName}`,
    message: `You have received a new message about "${propertyTitle}"`,
    metadata: {
      messageId,
      senderName,
      senderEmail,
      propertyTitle,
      messageText: messageText.substring(0, 100) + (messageText.length > 100 ? '...' : '')
    },
    priority: 'high'
  });

  return await messageNotification.save();
};

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Ensure virtual fields are serialized
notificationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);
