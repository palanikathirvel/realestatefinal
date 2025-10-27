const { validationResult } = require('express-validator');
const OTP = require('../models/OTP');
const Property = require('../models/Property');
const Land = require('../models/Land');
const House = require('../models/House');
const Rental = require('../models/Rental');
const Activity = require('../models/Activity');

// Helper: Find document across models by id (same as in propertyController)
const findByIdAcrossModels = async (id) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) return null;
  const models = [Land, House, Rental];
  for (const M of models) {
    const doc = await M.findById(id).populate('uploadedBy', 'name email phone');
    if (doc) {
      doc._model = M.modelName.toLowerCase();
      return doc;
    }
  }
  return null;
};

// Send OTP for property contact access
const sendOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { propertyId, phone } = req.body;
    const userId = req.user._id;

    // Basic phone number validation (Indian format)
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Use +91XXXXXXXXXX'
      });
    }

    // Check if property exists and is verified
    const property = await findByIdAcrossModels(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (property.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'Property is not verified yet'
      });
    }

    // Check for recent OTP requests (rate limiting)
    const recentOTP = await OTP.findOne({
      userId,
      propertyId,
      createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) } // 2 minutes
    });

    if (recentOTP) {
      return res.status(429).json({
        success: false,
        message: 'OTP already sent. Please wait 2 minutes before requesting again.',
        retryAfter: 120
      });
    }

    // Check daily OTP limit per user (prevent spam)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysOTPs = await OTP.countDocuments({
      userId,
      createdAt: { $gte: today }
    });

    if (todaysOTPs >= 10) {
      return res.status(429).json({
        success: false,
        message: 'Daily OTP limit exceeded. Please try again tomorrow.'
      });
    }

    // Generate OTP
    const otpCode = OTP.generateOTP();

    // Create OTP record
    const otpRecord = new OTP({
      userId,
      propertyId,
      phone,
      otp: otpCode,
      purpose: 'property_contact',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await otpRecord.save();

    // Note: WhatsApp OTP functionality has been removed
    // This endpoint now only creates OTP records for future email/SMS integration
    console.log(`📱 OTP generated: ${otpCode} for ${phone} (WhatsApp functionality removed)`);

    // Log OTP request activity
    await Activity.logActivity({
      action: 'otp_request',
      userId,
      propertyId,
      category: 'otp',
      details: `OTP requested for property contact: ${property.title}`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        phone
      }
    });

    res.json({
      success: true,
      message: 'OTP generated successfully (Note: WhatsApp functionality has been removed)',
      data: {
        otpId: otpRecord._id,
        expiryTime: otpRecord.expiryTime,
        attemptsRemaining: 3
      }
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify OTP and reveal property owner contact
const verifyOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { otpId, otp } = req.body;
    const userId = req.user._id;

    // Find OTP record
    const otpRecord = await OTP.findById(otpId).populate('propertyId');

    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        message: 'Invalid OTP request'
      });
    }

    // Get property with owner details using findByIdAcrossModels
    const property = await findByIdAcrossModels(otpRecord.propertyId._id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Verify ownership
    if (otpRecord.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized OTP verification attempt'
      });
    }

    // Check if OTP is already used
    if (otpRecord.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'OTP has already been used'
      });
    }

    // Check if OTP is expired
    if (otpRecord.isExpired || otpRecord.expiryTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check attempts limit
    if (otpRecord.attempts >= 3) {
      otpRecord.isExpired = true;
      await otpRecord.save();
      
      return res.status(400).json({
        success: false,
        message: 'Maximum OTP attempts exceeded. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (!otpRecord.isValidOTP(otp)) {
      await otpRecord.incrementAttempts();
      
      const remainingAttempts = 3 - otpRecord.attempts;
      
      // Log failed verification
      await Activity.logActivity({
        action: 'otp_verify',
        userId,
        propertyId: otpRecord.propertyId._id,
        category: 'security',
        severity: 'medium',
        status: 'failed',
        details: 'Invalid OTP provided',
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          attemptsRemaining: remainingAttempts
        }
      });

      return res.status(400).json({
        success: false,
        message: remainingAttempts > 0 
          ? `Invalid OTP. ${remainingAttempts} attempts remaining.`
          : 'Invalid OTP. Maximum attempts exceeded.',
        attemptsRemaining: remainingAttempts
      });
    }

    // OTP is valid - mark as used
    await otpRecord.markAsUsed();

    // Property already fetched above

    // Increment contact requests counter
    await property.incrementContactRequests();

    // Log successful verification and contact reveal
    await Activity.logActivity({
      action: 'otp_verify',
      userId,
      propertyId: property._id,
      category: 'otp',
      details: `OTP verified - Owner contact revealed for: ${property.title}`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        ownerPhone: property.ownerDetails.phone
      }
    });

    // Log contact request activity
    await Activity.logActivity({
      action: 'contact_request',
      userId,
      propertyId: property._id,
      category: 'property',
      details: `User requested owner contact for: ${property.title}`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        verificationMethod: 'whatsapp_otp'
      }
    });

    res.json({
      success: true,
      message: 'OTP verified successfully! Owner contact details revealed.',
      data: {
        property: {
          id: property._id,
          title: property.title,
          type: property.type,
          location: property.location
        },
        ownerDetails: property.ownerDetails,
        agent: {
          name: property.uploadedBy.name,
          email: property.uploadedBy.email,
          phone: property.uploadedBy.phone
        },
        verifiedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get OTP status
const getOTPStatus = async (req, res) => {
  try {
    const { otpId } = req.params;
    const userId = req.user._id;

    const otpRecord = await OTP.findById(otpId);
    
    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        message: 'OTP record not found'
      });
    }

    // Verify ownership
    if (otpRecord.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const now = new Date();
    const isExpired = otpRecord.isExpired || otpRecord.expiryTime <= now;
    const attemptsRemaining = Math.max(0, 3 - otpRecord.attempts);

    res.json({
      success: true,
      data: {
        otpId: otpRecord._id,
        isUsed: otpRecord.isUsed,
        isExpired,
        expiryTime: otpRecord.expiryTime,
        attemptsRemaining,
        canRetry: !otpRecord.isUsed && !isExpired && attemptsRemaining > 0
      }
    });

  } catch (error) {
    console.error('Get OTP status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OTP status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Resend OTP (if previous one expired)
const resendOTP = async (req, res) => {
  try {
    const { propertyId, phone } = req.body;
    const userId = req.user._id;

    // Find the last OTP for this property
    const lastOTP = await OTP.findOne({
      userId,
      propertyId,
      phone
    }).sort({ createdAt: -1 });

    if (!lastOTP) {
      return res.status(400).json({
        success: false,
        message: 'No previous OTP request found'
      });
    }

    // Check if property exists
    const property = await findByIdAcrossModels(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check if last OTP is still valid
    if (!lastOTP.isExpired && lastOTP.expiryTime > new Date() && lastOTP.attempts < 3) {
      return res.status(400).json({
        success: false,
        message: 'Previous OTP is still valid. Please use it or wait for expiry.',
        data: {
          otpId: lastOTP._id,
          expiryTime: lastOTP.expiryTime,
          attemptsRemaining: 3 - lastOTP.attempts
        }
      });
    }

    // Create new OTP request
    const newRequest = {
      ...req.body,
      userId
    };
    
    req.body = newRequest;
    return sendOTP(req, res);

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  getOTPStatus,
  resendOTP
};