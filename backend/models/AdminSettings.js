const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
  settingKey: {
    type: String,
    required: true,
    unique: true,
    enum: ['verification_mode', 'email_notifications', 'whatsapp_notifications']
  },
  settingValue: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Update the updatedAt field before saving
adminSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get verification mode
adminSettingsSchema.statics.getVerificationMode = async function() {
  try {
    const setting = await this.findOne({ settingKey: 'verification_mode' });
    return setting ? setting.settingValue : 'manual'; // Default to manual
  } catch (error) {
    console.error('Error getting verification mode:', error);
    return 'manual'; // Default to manual on error
  }
};

// Static method to set verification mode
adminSettingsSchema.statics.setVerificationMode = async function(mode, adminId) {
  try {
    const validModes = ['manual', 'auto'];
    if (!validModes.includes(mode)) {
      throw new Error('Invalid verification mode. Must be "manual" or "auto"');
    }

    const setting = await this.findOneAndUpdate(
      { settingKey: 'verification_mode' },
      {
        settingValue: mode,
        description: `Property verification mode - ${mode === 'manual' ? 'Manual admin approval required' : 'Automatic verification via API'}`,
        lastUpdatedBy: adminId,
        updatedAt: new Date()
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    return setting;
  } catch (error) {
    console.error('Error setting verification mode:', error);
    throw error;
  }
};

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);