const express = require('express');
const { body } = require('express-validator');
const {
  sendOTP,
  verifyOTP,
  getOTPStatus,
  resendOTP
} = require('../controllers/otpController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();
const Property = require('../models/Property');
const Land = require('../models/Land');
const House = require('../models/House');
const Rental = require('../models/Rental');
const User = require('../models/User');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');

// Helper: Find document across models by id (same as in propertyController)
const findByIdAcrossModels = async (id) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) return null;
  const models = [Land, House, Rental];
  for (const M of models) {
    const doc = await M.findById(id).populate('uploadedBy', 'name email phone role');
    if (doc) {
      doc._model = M.modelName.toLowerCase();
      return doc;
    }
  }
  return null;
};

// In-memory storage for OTPs (in production, use Redis or database)
const otpStorage = new Map();

// Generate random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Email OTP send endpoint for Contact Owner (no auth required)
router.post('/send-email-contact', async (req, res) => {
  try {
    const { email, propertyId } = req.body;

    if (!email || !propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Email and property ID are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
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

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with 5-minute expiry
    const otpData = {
      otp,
      email,
      propertyId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      verified: false,
      attempts: 0
    };
    
    const otpKey = `contact_${email}_${propertyId}`;
    otpStorage.set(otpKey, otpData);

    console.log(`📧 Contact Owner Email OTP: ${otp} for ${email}`);
    
    // Send OTP via Email
    try {
      const emailResult = await emailService.sendOTPEmail(email, 'User', otp);
      
      if (!emailResult.success) {
        // Remove from storage if sending failed
        otpStorage.delete(otpKey);
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP via email. Please try again.',
          error: emailResult.error
        });
      }
      
      res.json({
        success: true,
        message: `OTP sent to email address ${email}`,
        // In development, return OTP for testing
        ...(process.env.NODE_ENV === 'development' && { otp })
      });

    } catch (emailError) {
      otpStorage.delete(otpKey);
      console.error('Email sending error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP via email. Please try again.'
      });
    }

  } catch (error) {
    console.error('Send Contact Owner Email OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

// Email OTP verify endpoint for Contact Owner (no auth required)
router.post('/verify-email-contact', async (req, res) => {
  try {
    const { email, otp, propertyId, userId } = req.body;

    if (!email || !otp || !propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and property ID are required'
      });
    }

    // Get stored OTP data
    const otpKey = `contact_${email}_${propertyId}`;
    const storedOtpData = otpStorage.get(otpKey);

    if (!storedOtpData) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this email. Please request a new OTP.'
      });
    }

    // Check if OTP expired
    if (new Date() > storedOtpData.expiresAt) {
      otpStorage.delete(otpKey);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Check attempts limit
    if (storedOtpData.attempts >= 3) {
      otpStorage.delete(otpKey);
      return res.status(400).json({
        success: false,
        message: 'Maximum attempts exceeded. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (storedOtpData.otp !== otp) {
      storedOtpData.attempts++;
      const remainingAttempts = 3 - storedOtpData.attempts;
      
      if (remainingAttempts <= 0) {
        otpStorage.delete(otpKey);
      }
      
      return res.status(400).json({
        success: false,
        message: remainingAttempts > 0 
          ? `Invalid OTP. ${remainingAttempts} attempts remaining.`
          : 'Invalid OTP. Maximum attempts exceeded.'
      });
    }

    // Get property with owner details
    const property = await findByIdAcrossModels(propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Get user details if userId is provided (for notifications)
    let user = null;
    if (userId) {
      user = await User.findById(userId).select('name email phone');
    }

    // Prepare owner details
    const ownerDetails = {
      name: property.ownerDetails?.name || property.uploadedBy?.name || 'Property Owner',
      phone: property.ownerDetails?.phone || property.uploadedBy?.phone || 'Not available',
      email: property.ownerDetails?.email || property.uploadedBy?.email || null,
      propertyId: propertyId,
      verifiedAt: new Date()
    };

    // Create notifications if user is authenticated
    if (user && property.uploadedBy) {
      try {
        // Create notification for the agent who uploaded the property
        await Notification.createContactOwnerNotification({
          userId: user._id,
          agentId: property.uploadedBy._id,
          propertyId: propertyId,
          userEmail: user.email,
          userName: user.name,
          agentName: property.uploadedBy.name,
          propertyTitle: property.title
        });

        // Create notification for admin (find admin users)
        const adminUsers = await User.find({ role: 'admin' }).select('_id');
        for (const admin of adminUsers) {
          await Notification.createAdminNotification({
            userId: user._id,
            agentId: property.uploadedBy._id,
            adminId: admin._id,
            propertyId: propertyId,
            userEmail: user.email,
            userName: user.name,
            agentName: property.uploadedBy.name,
            propertyTitle: property.title
          });
        }

        console.log(`🔔 Notifications created for contact request by ${user.name}`);
      } catch (notificationError) {
        console.error('Error creating notifications:', notificationError);
        // Don't fail the main request if notifications fail
      }
    }

    // Clean up OTP data after successful verification
    otpStorage.delete(otpKey);

    console.log(`✅ Email OTP verified for ${email}, Property: ${propertyId}`);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      ownerDetails: ownerDetails
    });

  } catch (error) {
    console.error('Verify Contact Owner Email OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});

// All other OTP routes require authentication
router.use(authenticateToken);

// OTP validation rules
const sendOTPValidation = [
  body('propertyId')
    .isMongoId()
    .withMessage('Invalid property ID'),
  
  body('phone')
    .matches(/^\+91[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number (+91XXXXXXXXXX)')
];

const verifyOTPValidation = [
  body('otpId')
    .isMongoId()
    .withMessage('Invalid OTP ID'),
  
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number')
];

const resendOTPValidation = [
  body('propertyId')
    .isMongoId()
    .withMessage('Invalid property ID'),
  
  body('phone')
    .matches(/^\+91[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number (+91XXXXXXXXXX)')
];

// Original authenticated routes
router.post('/send', sendOTPValidation, sendOTP);
router.post('/verify', verifyOTPValidation, verifyOTP);
router.get('/status/:otpId', getOTPStatus);
router.post('/resend', resendOTPValidation, resendOTP);

module.exports = router;