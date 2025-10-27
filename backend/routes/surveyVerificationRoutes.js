const express = require('express');
const { body } = require('express-validator');
const {
  verifySurveyNumber,
  getAvailableSurveyNumbers,
  getSurveyStatistics
} = require('../controllers/surveyVerificationController');

const router = express.Router();

// Survey number verification validation
const surveyVerificationValidation = [
  body('surveyNumber')
    .trim()
    .notEmpty()
    .withMessage('Survey number is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Survey number must be between 3 and 50 characters'),
  
  body('district')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('District must be between 2 and 50 characters'),
  
  body('taluk')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Taluk must be between 2 and 50 characters')
];

// Routes
router.post('/verify', surveyVerificationValidation, verifySurveyNumber);
router.get('/available', getAvailableSurveyNumbers); // For testing purposes
router.get('/statistics', getSurveyStatistics); // For district-wise statistics

module.exports = router;