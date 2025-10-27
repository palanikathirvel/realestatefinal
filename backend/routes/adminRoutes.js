const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const {
  adminLogin,
  getDashboardOverview,
  getPendingProperties,
  verifyProperty,
  getAllUsers,
  updateUserStatus,
  getActivities,
  getSecurityAlerts,
  getAnalytics,
  getVerificationSettings,
  updateVerificationSettings
} = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

// Admin login rate limiter - more strict for login attempts
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 admin login attempts per 15 minutes
  message: {
    error: 'Too many admin login attempts. Please try again in 15 minutes.',
    retryAfter: 900 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin login route (no authentication required)
router.post('/login', adminLoginLimiter, adminLogin);

// All other admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Validation rules
const verifyPropertyValidation = [
  body('status')
    .isIn(['verified', 'rejected'])
    .withMessage('Status must be either verified or rejected'),
  
  body('verificationNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Verification notes cannot exceed 500 characters')
];

const updateUserStatusValidation = [
  body('status')
    .isIn(['active', 'blocked'])
    .withMessage('Status must be either active or blocked'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
];

const updateUserRoleValidation = [
  body('role')
    .isIn(['user', 'agent', 'admin'])
    .withMessage('Role must be user, agent, or admin'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
];

const verificationSettingsValidation = [
  body('verificationMode')
    .isIn(['manual', 'auto'])
    .withMessage('Verification mode must be either manual or auto')
];

// Dashboard and Overview Routes
router.get('/dashboard', getDashboardOverview);
router.get('/analytics', getAnalytics);

// Property Management Routes
router.get('/properties/pending', getPendingProperties);
router.put('/properties/:id/verify', verifyPropertyValidation, verifyProperty);

// User Management Routes
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatusValidation, updateUserStatus);
router.put('/users/:id/role', updateUserRoleValidation, (req, res) => {
  // Use the same controller but ensure only role is passed
  req.body = { role: req.body.role, reason: req.body.reason };
  updateUserStatus(req, res);
});

// Activity Monitoring Routes
router.get('/activities', getActivities);
router.get('/security-alerts', getSecurityAlerts);

// Verification Settings Routes
router.get('/settings/verification', getVerificationSettings);
router.put('/settings/verification', verificationSettingsValidation, updateVerificationSettings);

module.exports = router;