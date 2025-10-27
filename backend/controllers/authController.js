const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Activity = require('../models/Activity');
const OTP = require('../models/OTP');
const emailService = require('../services/emailService');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Send OTP for email verification (first step of registration)
const sendEmailOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { phone }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Phone number already registered'
      });
    }

    // Delete any existing OTP for this email
    await OTP.deleteMany({ 
      email: email.toLowerCase(), 
      purpose: 'email_verification' 
    });

    // Generate OTP
    const otp = emailService.generateOTP();

    // Create OTP record
    const otpRecord = new OTP({
      email: email.toLowerCase(),
      otp,
      purpose: 'email_verification',
      userData: {
        name: name.trim(),
        role: role || 'user',
        phone
      },
      expiryTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await otpRecord.save();

    // Send OTP email
    const emailResult = await emailService.sendOTPEmail(
      email.toLowerCase(),
      name.trim(),
      otp
    );

    if (!emailResult.success) {
      // Delete OTP record if email failed
      await OTP.deleteOne({ _id: otpRecord._id });
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.',
        error: emailResult.error
      });
    }

    console.log(`📧 OTP sent successfully to ${email}`);

    res.json({
      success: true,
      message: 'OTP sent successfully to your email',
      data: {
        email: email.toLowerCase(),
        expiryTime: otpRecord.expiryTime
      }
    });

  } catch (error) {
    console.error('Send email OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify OTP and complete registration
const verifyEmailAndRegister = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp, password, address } = req.body;

    // Find OTP record
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'email_verification',
      isUsed: false,
      isExpired: false,
      expiryTime: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired or is invalid. Please request a new OTP.'
      });
    }

    // Validate OTP
    if (!otpRecord.isValidOTP(otp)) {
      await otpRecord.incrementAttempts();
      
      const remainingAttempts = 3 - otpRecord.attempts;
      if (remainingAttempts <= 0) {
        return res.status(400).json({
          success: false,
          message: 'OTP verification failed. Maximum attempts exceeded. Please request a new OTP.'
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
      });
    }

    // Check if user was created in the meantime
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { phone: otpRecord.userData.phone }
      ]
    });

    if (existingUser) {
      await otpRecord.markAsUsed();
      return res.status(409).json({
        success: false,
        message: 'User already registered. Please login instead.'
      });
    }

    // Create new user
    const userData = {
      name: otpRecord.userData.name,
      email: email.toLowerCase(),
      password,
      phone: otpRecord.userData.phone,
      role: otpRecord.userData.role,
      emailVerified: true, // Mark email as verified
      verifiedAt: new Date()
    };

    if (address) {
      userData.address = address;
    }

    const user = new User(userData);
    await user.save();

    // Mark OTP as used
    await otpRecord.markAsUsed();

    // Generate token
    const token = generateToken(user._id);

    // Send welcome email
    await emailService.sendWelcomeEmail(
      user.email,
      user.name,
      user.role
    );

    // Log registration activity
    await Activity.logActivity({
      action: 'user_register',
      userId: user._id,
      category: 'auth',
      details: `New ${user.role} registered with email verification: ${email}`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        role: user.role,
        emailVerified: true
      }
    });

    // Return user data (excluding password)
    const userResponse = user.getPublicProfile();

    res.status(201).json({
      success: true,
      message: 'Registration completed successfully! Welcome email sent.',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Verify email and register error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Resend OTP for email verification
const resendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find existing OTP record
    const existingOTP = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'email_verification'
    }).sort({ createdAt: -1 });

    if (!existingOTP) {
      return res.status(400).json({
        success: false,
        message: 'No OTP request found for this email. Please start registration again.'
      });
    }

    // Check rate limiting (1 minute between requests)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (existingOTP.createdAt > oneMinuteAgo) {
      return res.status(429).json({
        success: false,
        message: 'Please wait at least 1 minute before requesting a new OTP.'
      });
    }

    // Delete old OTP records
    await OTP.deleteMany({ 
      email: email.toLowerCase(), 
      purpose: 'email_verification' 
    });

    // Generate new OTP
    const otp = emailService.generateOTP();

    // Create new OTP record with same user data
    const otpRecord = new OTP({
      email: email.toLowerCase(),
      otp,
      purpose: 'email_verification',
      userData: existingOTP.userData,
      expiryTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await otpRecord.save();

    // Send OTP email
    const emailResult = await emailService.sendOTPEmail(
      email.toLowerCase(),
      existingOTP.userData.name,
      otp
    );

    if (!emailResult.success) {
      // Delete OTP record if email failed
      await OTP.deleteOne({ _id: otpRecord._id });
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.',
        error: emailResult.error
      });
    }

    console.log(`📧 Resent OTP successfully to ${email}`);

    res.json({
      success: true,
      message: 'New OTP sent successfully to your email',
      data: {
        email: email.toLowerCase(),
        expiryTime: otpRecord.expiryTime
      }
    });

  } catch (error) {
    console.error('Resend email OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// User Registration (legacy - now replaced by email OTP flow)
const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { phone }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Phone number already registered'
      });
    }

    // Create new user
    const userData = {
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      phone,
      role: role || 'user'
    };

    if (address) {
      userData.address = address;
    }

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Log registration activity
    await Activity.logActivity({
      action: 'user_register',
      userId: user._id,
      category: 'auth',
      details: `New ${role || 'user'} registered: ${email}`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        role: role || 'user'
      }
    });

    // Return user data (excluding password)
    const userResponse = user.getPublicProfile();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// User Login
const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, username } = req.body;

    // Find user by email or username
    let user;
    if (username) {
      user = await User.findOne({ $or: [ { email: email?.toLowerCase() }, { name: username } ] }).select('+password');
    } else {
      user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
    }

    if (!user) {
      // Don't log activity for non-existent users to avoid userId validation error
      return res.status(401).json({
        success: false,
        message: 'Invalid email, username, or password'
      });
    }

    // Check if account is blocked
    if (user.status === 'blocked') {
      await Activity.logActivity({
        action: 'user_login',
        userId: user._id,
        category: 'security',
        severity: 'high',
        status: 'failed',
        details: 'Login attempt on blocked account',
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      return res.status(403).json({
        success: false,
        message: 'Account has been blocked. Please contact administrator.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await Activity.logActivity({
        action: 'user_login',
        userId: user._id,
        category: 'security',
        severity: 'medium',
        status: 'failed',
        details: 'Login attempt with incorrect password',
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Log successful login
    await Activity.logActivity({
      action: 'user_login',
      userId: user._id,
      category: 'auth',
      details: `User logged in successfully`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    // Return user data (excluding password)
    const userResponse = user.getPublicProfile();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// User Logout
const logout = async (req, res) => {
  try {
    // Log logout activity
    if (req.user) {
      await Activity.logActivity({
        action: 'user_logout',
        userId: req.user._id,
        category: 'auth',
        details: 'User logged out',
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Current User Profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update User Profile
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, phone, address, profileImage } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (profileImage) updateData.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log profile update
    await Activity.logActivity({
      action: 'profile_update',
      userId: user._id,
      category: 'user_action',
      details: 'Profile updated successfully',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        updatedFields: Object.keys(updateData)
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log password change
    await Activity.logActivity({
      action: 'password_change',
      userId: user._id,
      category: 'security',
      details: 'Password changed successfully',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Forgot Password - Send OTP
const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address'
      });
    }

    // Check if account is blocked
    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Account has been blocked. Please contact administrator.'
      });
    }

    // Delete any existing password reset OTP for this email
    await OTP.deleteMany({ 
      email: email.toLowerCase(), 
      purpose: 'password_reset' 
    });

    // Generate OTP
    const otp = OTP.generateOTP();

    // Create OTP record
    const otpRecord = new OTP({
      email: email.toLowerCase(),
      userId: user._id,
      otp,
      purpose: 'password_reset',
      expiryTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes for password reset
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await otpRecord.save();

    // Send OTP email
    const emailResult = await emailService.sendPasswordResetOTP(
      email.toLowerCase(),
      user.name,
      otp
    );

    if (!emailResult.success) {
      // Delete OTP record if email failed
      await OTP.deleteOne({ _id: otpRecord._id });
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again.',
        error: emailResult.error
      });
    }

    // Log activity
    await Activity.logActivity({
      action: 'password_reset_requested',
      userId: user._id,
      category: 'security',
      details: 'Password reset OTP requested',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    console.log(`📧 Password reset OTP sent successfully to ${email}`);

    res.json({
      success: true,
      message: 'Password reset OTP sent successfully to your email',
      data: {
        email: email.toLowerCase(),
        expiryTime: otpRecord.expiryTime
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reset Password with OTP
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp, newPassword } = req.body;

    // Find OTP record
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'password_reset',
      isUsed: false,
      isExpired: false,
      expiryTime: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired or is invalid. Please request a new password reset.'
      });
    }

    // Validate OTP
    if (!otpRecord.isValidOTP(otp)) {
      await otpRecord.incrementAttempts();
      
      const remainingAttempts = 3 - otpRecord.attempts;
      if (remainingAttempts <= 0) {
        return res.status(400).json({
          success: false,
          message: 'OTP verification failed. Maximum attempts exceeded. Please request a new password reset.'
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
      });
    }

    // Find user
    const user = await User.findById(otpRecord.userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if account is still active
    if (user.status === 'blocked') {
      await otpRecord.markAsUsed();
      return res.status(403).json({
        success: false,
        message: 'Account has been blocked. Please contact administrator.'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Mark OTP as used
    await otpRecord.markAsUsed();

    // Send password change confirmation email
    await emailService.sendPasswordChangeConfirmation(
      user.email,
      user.name
    );

    // Log password reset activity
    await Activity.logActivity({
      action: 'password_reset_completed',
      userId: user._id,
      category: 'security',
      details: 'Password reset completed successfully via OTP',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    console.log(`🔐 Password reset completed successfully for ${email}`);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  sendEmailOTP,
  verifyEmailAndRegister,
  resendEmailOTP,
  register, // Legacy registration method
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
};