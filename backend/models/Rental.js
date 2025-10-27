const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
    type: { type: String, default: 'rental' },
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
    squareFeet: { type: Number, min: [1, 'Square feet must be greater than 0'] }, // optional
    monthlyPayment: {
        amount: { type: Number, required: true, min: [1, 'Monthly payment must be greater than 0'] },
        currency: { type: String, default: 'INR' }
    },
    rules: [{ type: String, required: true }], // rules to follow
    charges: [{ // water or any special charges
        name: { type: String, required: true },
        amount: { type: Number, required: true, min: [0, 'Charge amount cannot be negative'] }
    }],
    rooms: [{
        name: { type: String, required: true },
        type: { type: String, required: true, enum: ['bachelor', 'family'] },
        photos: [{
            base64: { type: String, required: true },
            mimeType: { type: String },
            caption: String,
            url: { type: String }
        }]
    }],
    agreement: {
        base64: { type: String, required: true },
        mimeType: { type: String },
        uploadedAt: { type: Date, default: Date.now },
        url: { type: String }
    },
    advancePayment: {
        amount: { type: Number, required: true, min: [0, 'Advance payment cannot be negative'] },
        refundable: { type: Boolean, default: false },
        returnRules: { type: String, required: true } // return rules
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
rentalSchema.index({ verificationStatus: 1 });
rentalSchema.index({ 'location.district': 1 });
rentalSchema.index({ 'location.taluk': 1 });
rentalSchema.index({ 'monthlyPayment.amount': 1 });
rentalSchema.index({ uploadedBy: 1 });
rentalSchema.index({ createdAt: -1 });

// Compound indexes
rentalSchema.index({ verificationStatus: 1, 'location.district': 1 });

// Pre-save hook
rentalSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get verified rentals
rentalSchema.statics.getVerifiedRentals = function(filter = {}) {
    return this.find({ verificationStatus: 'verified', isActive: true, ...filter })
        .populate('uploadedBy', 'name email phone');
};

// Static method to get rentals by agent
rentalSchema.statics.getAgentRentals = function(agentId) {
    return this.find({ uploadedBy: agentId })
        .populate('uploadedBy', 'name email')
        .populate('verificationDetails.verifiedBy', 'name');
};

// Instance method to increment views
rentalSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Instance method to increment contact requests
rentalSchema.methods.incrementContactRequests = function() {
    this.contactRequests += 1;
    return this.save();
};

module.exports = mongoose.model('Rental', rentalSchema);
