const express = require('express');
const { body } = require('express-validator');
const {
  sendEmailOTP,
  verifyEmailAndRegister,
  resendEmailOTP,
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Email OTP validation
const emailOTPValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .matches(/^\+91[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number (+91XXXXXXXXXX)'),
  
  body('role')
    .optional()
    .isIn(['user', 'agent'])
    .withMessage('Role must be either user or agent')
];

const verifyEmailValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('address.street').optional().trim().isLength({ max: 100 }),
  body('address.city').optional().trim().isLength({ max: 50 }),
  body('address.state').optional().trim().isLength({ max: 50 }),
  body('address.pincode').optional().matches(/^\d{6}$/).withMessage('Pincode must be 6 digits')
];

const resendOTPValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('phone')
    .matches(/^\+91[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number (+91XXXXXXXXXX)'),
  
  body('role')
    .optional()
    .isIn(['user', 'agent'])
    .withMessage('Role must be either user or agent'),
  
  body('address.street').optional().trim().isLength({ max: 100 }),
  body('address.city').optional().trim().isLength({ max: 50 }),
  body('address.state').optional().trim().isLength({ max: 50 }),
  body('address.pincode').optional().matches(/^\d{6}$/).withMessage('Pincode must be 6 digits')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .matches(/^\+91[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number'),
  
  body('address.street').optional().trim().isLength({ max: 100 }),
  body('address.city').optional().trim().isLength({ max: 50 }),
  body('address.state').optional().trim().isLength({ max: 50 }),
  body('address.pincode').optional().matches(/^\d{6}$/).withMessage('Pincode must be 6 digits'),
  
  body('profileImage')
    .optional()
    .isURL()
    .withMessage('Profile image must be a valid URL')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const resetPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// Public routes
// New email OTP registration flow
router.post('/send-email-otp', emailOTPValidation, sendEmailOTP);
router.post('/verify-email-otp', verifyEmailValidation, verifyEmailAndRegister);
router.post('/resend-email-otp', resendOTPValidation, resendEmailOTP);

// Legacy registration and login
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Forgot password routes (public)
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);

// Protected routes
router.use(authenticateToken); // Apply authentication to all routes below

router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', updateProfileValidation, updateProfile);
router.put('/change-password', changePasswordValidation, changePassword);

module.exports = router;