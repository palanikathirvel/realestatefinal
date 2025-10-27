const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['bedroom', 'kitchen', 'bathroom', 'study', 'living room', 'dining room', 'balcony', 'hall', 'other'] },
    sizeSqFt: { type: Number, required: true, min: [1, 'Room size must be greater than 0'] },
    photos: [{
        base64: { type: String, required: true },
        mimeType: { type: String },
        caption: String,
        url: { type: String }
    }]
});

const houseSchema = new mongoose.Schema({
    type: { type: String, default: 'house' },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: {
        district: { type: String, required: true, trim: true },
        taluk: { type: String, required: true, trim: true },
        area: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true }, // full address
        pincode: { type: String, required: true, match: [/^\d{6}$/, 'Please provide a valid 6-digit pincode'] },
        coordinates: { latitude: Number, longitude: Number }
    },
    squareFeet: { type: Number, required: true, min: [1, 'Square feet must be greater than 0'] },
    price: { type: Number, required: true, min: [1, 'Price must be greater than 0'] },
    features: {
        noOfRooms: { type: Number, min: 0, default: 0 },
        rooms: [roomSchema],
        specialRooms: [{
            name: { type: String, required: true },
            sizeSqFt: { type: Number },
            photos: [{
                base64: { type: String, required: true },
                mimeType: { type: String },
                caption: String,
                url: { type: String }
            }]
        }],
        furnished: { type: String, enum: ['unfurnished', 'semi-furnished', 'fully-furnished'], default: 'unfurnished' },
        amenities: [String]
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
    geoTagPhoto: {
        base64: { type: String, required: true },
        mimeType: { type: String },
        uploadedAt: { type: Date, default: Date.now },
        url: { type: String }
    },
    specifications: {
        gateDirection: { type: String, enum: ['east', 'west', 'north', 'south'], required: true },
        otherSpecs: mongoose.Schema.Types.Mixed // for additional specifications like east or west gate, etc.
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
houseSchema.index({ verificationStatus: 1 });
houseSchema.index({ 'location.district': 1 });
houseSchema.index({ 'location.taluk': 1 });
houseSchema.index({ price: 1 });
houseSchema.index({ squareFeet: 1 });
houseSchema.index({ uploadedBy: 1 });
houseSchema.index({ createdAt: -1 });

// Compound indexes
houseSchema.index({ verificationStatus: 1, 'location.district': 1 });

// Pre-save hook to calculate noOfRooms
houseSchema.pre('save', function(next) {
    if (this.features && this.features.rooms) {
        this.features.noOfRooms = this.features.rooms.length;
    }
    this.updatedAt = Date.now();
    next();
});

// Static method to get verified houses
houseSchema.statics.getVerifiedHouses = function(filter = {}) {
    return this.find({ verificationStatus: 'verified', isActive: true, ...filter })
        .populate('uploadedBy', 'name email phone');
};

// Static method to get houses by agent
houseSchema.statics.getAgentHouses = function(agentId) {
    return this.find({ uploadedBy: agentId })
        .populate('uploadedBy', 'name email')
        .populate('verificationDetails.verifiedBy', 'name');
};

// Instance method to increment views
houseSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Instance method to increment contact requests
houseSchema.methods.incrementContactRequests = function() {
    this.contactRequests += 1;
    return this.save();
};

module.exports = mongoose.model('House', houseSchema);
