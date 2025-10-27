const mongoose = require('mongoose');

const landSchema = new mongoose.Schema({
    type: { type: String, default: 'land' },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    surveyNumber: { type: String, required: true, trim: true },
    location: {
        district: { type: String, required: true, trim: true },
        taluk: { type: String, required: true, trim: true },
        area: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true }, // full address
        pincode: { type: String, required: true, match: [/^\d{6}$/, 'Please provide a valid 6-digit pincode'] },
        coordinates: { latitude: Number, longitude: Number }
    },
    squareFeet: { type: Number, required: true, min: [1, 'Square feet must be greater than 0'] },
    pricePerAcre: { type: Number, required: true, min: [1, 'Price per acre must be greater than 0'] },
    price: { type: Number, required: true, min: [1, 'Price must be greater than 0'] },
    facilities: {
        waterNearby: { type: Boolean, default: false },
        electricity: { type: Boolean, default: false },
        nearbyBuildings: { type: Boolean, default: false }
    },
    images: [{
        base64: { type: String, required: true },
        mimeType: { type: String },
        caption: String,
        isPrimary: { type: Boolean, default: false },
        url: { type: String }
    }],
    video: {
        base64: { type: String },
        mimeType: { type: String },
        caption: String,
        url: { type: String }
    },
    ownerDetails: {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, match: [/^\+91[6-9]\d{9}$/, 'Please provide a valid Indian phone number'] },
        email: { type: String, match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'] },
        alternatePhone: { type: String, match: [/^\+91[6-9]\d{9}$/, 'Please provide a valid Indian phone number'] }
    },
    verificationStatus: { type: String, enum: ['pending_verification', 'verified', 'rejected'], default: 'pending_verification' },
    verificationDetails: {
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date,
        verificationNotes: String,
        rejectionReason: String
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    contactRequests: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes for better performance
landSchema.index({ verificationStatus: 1 });
landSchema.index({ 'location.district': 1 });
landSchema.index({ 'location.taluk': 1 });
landSchema.index({ price: 1 });
landSchema.index({ squareFeet: 1 });
landSchema.index({ uploadedBy: 1 });
landSchema.index({ createdAt: -1 });

// Compound indexes
landSchema.index({ verificationStatus: 1, 'location.district': 1 });

// Calculate total price if not provided
landSchema.pre('save', function(next) {
    if (this.pricePerAcre && this.squareFeet && !this.price) {
        // Assuming 1 acre = 43560 sq ft, but since squareFeet is given, perhaps calculate based on that
        // But task says price per acre and total price, so if total price not set, calculate
        // For simplicity, if price not set, set it to pricePerAcre * (squareFeet / 43560)
        const acres = this.squareFeet / 43560;
        this.price = Math.round(this.pricePerAcre * acres);
    }
    this.updatedAt = Date.now();
    next();
});

// Static method to get verified lands
landSchema.statics.getVerifiedLands = function(filter = {}) {
    return this.find({ verificationStatus: 'verified', isActive: true, ...filter })
        .populate('uploadedBy', 'name email phone');
};

// Static method to get lands by agent
landSchema.statics.getAgentLands = function(agentId) {
    return this.find({ uploadedBy: agentId })
        .populate('uploadedBy', 'name email')
        .populate('verificationDetails.verifiedBy', 'name');
};

// Instance method to increment views
landSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Instance method to increment contact requests
landSchema.methods.incrementContactRequests = function() {
    this.contactRequests += 1;
    return this.save();
};

module.exports = mongoose.model('Land', landSchema);
