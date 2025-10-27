const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Subject cannot be more than 100 characters']
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  senderName: {
    type: String,
    required: true,
    trim: true
  },
  senderEmail: {
    type: String,
    required: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  senderPhone: {
    type: String,
    match: [/^\+91[6-9]\d{9}$/, 'Please provide a valid Indian phone number']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'replied'],
    default: 'sent'
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
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
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, createdAt: -1 });
messageSchema.index({ property: 1 });
messageSchema.index({ isRead: 1 });
messageSchema.index({ status: 1 });

// Update the updatedAt field before saving
messageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get conversation between two users about a property
messageSchema.statics.getConversation = function(senderId, recipientId, propertyId) {
  return this.find({
    $or: [
      { sender: senderId, recipient: recipientId, property: propertyId },
      { sender: recipientId, recipient: senderId, property: propertyId }
    ]
  })
  .populate('sender', 'name email phone')
  .populate('recipient', 'name email phone')
  .sort({ createdAt: 1 });
};

// Static method to get messages for a user
messageSchema.statics.getUserMessages = function(userId, filters = {}) {
  const query = {
    $or: [{ sender: userId }, { recipient: userId }],
    ...filters
  };

  return this.find(query)
    .populate('sender', 'name email phone')
    .populate('recipient', 'name email phone')
    .populate('property', 'title type location')
    .sort({ createdAt: -1 });
};

// Instance method to mark as read
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  this.status = 'read';
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);
