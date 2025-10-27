const express = require('express');
const { body } = require('express-validator');
const {
  getAllProperties,
  getAllPropertiesForAdmin,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getAgentProperties,
  getPropertiesByType,
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  approveProperty,
  rejectProperty,
  sendContactMessage
} = require('../controllers/propertyController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');
const { requireAgentOrAdmin, requireOwnerOrAdmin, requireAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

// Property validation rules
const propertyValidation = [
  body('type')
    .isIn(['land', 'house', 'rental'])
    .withMessage('Type must be land, house, or rental'),

  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),

  body('description')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Description must be between 20 and 1000 characters'),

  body('surveyNumber').custom((value, { req }) => {
    if (req.body.type === 'land') {
      if (!value || !value.trim()) throw new Error('Survey number is required for land');
    }
    return true;
  }),

  // For land, pricePerAcre required
  body('pricePerAcre').custom((value, { req }) => {
    if (req.body.type === 'land') {
      if (!value || Number(value) <= 0) throw new Error('Price per acre is required for land');
    }
    return true;
  }),

  // For house, geoTagPhoto required
  body('geoTagPhoto').custom((value, { req }) => {
    if (req.body.type === 'house') {
      if (!value || !value.url) throw new Error('GeoTag photo is required for house approval');
    }
    return true;
  }),

  // For house, specifications.gateDirection required
  body('specifications.gateDirection').custom((value, { req }) => {
    if (req.body.type === 'house') {
      if (!value) throw new Error('Gate direction is required for house');
    }
    return true;
  }),

  // For rentals, ensure monthly payment object exists with amount
  body('monthlyPayment').custom((value, { req }) => {
    if (req.body.type === 'rental') {
      if (!value || typeof value !== 'object') throw new Error('monthlyPayment must be provided for rentals');
      if (!value.amount || Number(value.amount) <= 0) throw new Error('monthlyPayment.amount must be a positive number');
    }
    return true;
  }),

  // For rentals, agreement required
  body('agreement').custom((value, { req }) => {
    if (req.body.type === 'rental') {
      if (!value || !value.url) throw new Error('Agreement copy is required for rental');
    }
    return true;
  }),

  // For rentals, advancePayment required
  body('advancePayment').custom((value, { req }) => {
    if (req.body.type === 'rental') {
      if (!value || typeof value !== 'object') throw new Error('advancePayment must be provided for rentals');
      if (!value.amount || Number(value.amount) < 0) throw new Error('advancePayment.amount must be provided');
      if (!value.returnRules || !value.returnRules.trim()) throw new Error('advancePayment.returnRules must be provided');
    }
    return true;
  }),

  body('location.district')
    .trim()
    .notEmpty()
    .withMessage('District is required'),

  body('location.taluk')
    .trim()
    .notEmpty()
    .withMessage('Taluk is required'),

  body('location.area')
    .trim()
    .notEmpty()
    .withMessage('Area is required'),

  body('location.address')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Full address must be between 10 and 200 characters'),

  body('location.pincode')
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be 6 digits'),

  body('squareFeet')
    .isInt({ min: 1 })
    .withMessage('Square feet must be a positive number'),

  body('price').custom((value, { req }) => {
    if (req.body.type !== 'rental') {
      if (!value || Number(value) <= 0) throw new Error('Price is required and must be positive for non-rental properties');
    }
    return true;
  }),

  body('ownerDetails.name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Owner name must be between 2 and 50 characters'),

  body('ownerDetails.phone')
    .matches(/^\+91[6-9]\d{9}$/)
    .withMessage('Owner phone must be a valid Indian number'),

  body('ownerDetails.email')
    .optional()
    .isEmail()
    .withMessage('Owner email must be valid'),

  // Optional fields validation
  body('features.bedrooms').optional().isInt({ min: 0 }),
  body('features.bathrooms').optional().isInt({ min: 0 }),
  body('features.parking').optional().isBoolean(),
  body('features.furnished').optional().isIn(['unfurnished', 'semi-furnished', 'fully-furnished']),
  body('features.amenities').optional().isArray(),

  body('images').optional().isArray(),
  body('images.*.caption').optional().trim().isLength({ max: 100 }),
  body('images.*.isPrimary').optional().isBoolean(),

  body('location.coordinates.latitude').optional().isFloat({ min: -90, max: 90 }),
  body('location.coordinates.longitude').optional().isFloat({ min: -180, max: 180 })
];

const propertyUpdateValidation = [
  body('type')
    .optional()
    .isIn(['land', 'house', 'rental'])
    .withMessage('Type must be land, house, or rental'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Description must be between 20 and 1000 characters'),

  body('surveyNumber')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Survey number cannot be empty'),

  body('location.district')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('District cannot be empty'),

  body('location.taluk')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Taluk cannot be empty'),

  body('location.area')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Area cannot be empty'),

  body('location.address')
    .optional()
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Full address must be between 10 and 200 characters'),

  body('location.pincode')
    .optional()
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be 6 digits'),

  body('squareFeet')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Square feet must be a positive number'),

  body('price')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Price must be a positive number'),

  body('ownerDetails.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Owner name must be between 2 and 50 characters'),

  body('ownerDetails.phone')
    .optional()
    .matches(/^\+91[6-9]\d{9}$/)
    .withMessage('Owner phone must be a valid Indian number'),

  body('ownerDetails.email')
    .optional()
    .isEmail()
    .withMessage('Owner email must be valid')
];

// Public routes (no authentication required)
router.get('/', optionalAuth, getAllProperties);
router.get('/type/:type', optionalAuth, getPropertiesByType);

// Protected routes (authentication required)
router.use(authenticateToken);

// Admin-only routes
router.get('/all', requireAdmin, getAllPropertiesForAdmin);
router.put('/:id/approve', requireAdmin, approveProperty);
router.put('/:id/reject', requireAdmin, rejectProperty);

// Agent routes
router.post('/', requireAgentOrAdmin, propertyValidation, createProperty);
router.get('/agent/my-properties', requireAgentOrAdmin, getAgentProperties);

// Property-specific routes (must come after authentication and before generic /:id)
router.put('/:id', requireOwnerOrAdmin, propertyUpdateValidation, updateProperty);
router.delete('/:id', requireOwnerOrAdmin, deleteProperty);

// Favorites routes
router.get('/user/favorites', getUserFavorites);
router.post('/favorites/:propertyId', addToFavorites);
router.delete('/favorites/:propertyId', removeFromFavorites);

// Contact message route
router.post('/:id/contact-message', optionalAuth, sendContactMessage);

// Generic route (must be last)
router.get('/:id', optionalAuth, getPropertyById);

module.exports = router;