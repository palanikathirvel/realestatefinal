const mongoose = require('mongoose');
const Survey = require('../models/Survey');

// Verify survey number using MongoDB
const verifySurveyNumber = async (req, res) => {
  try {
    const { surveyNumber, district, taluk } = req.body;

    if (!surveyNumber) {
      return res.status(400).json({
        success: false,
        message: 'Survey number is required'
      });
    }

    console.log(`🔍 Auto-verification request for survey number: ${surveyNumber}`);

    // Simulate API delay (like a real government API)
    await new Promise(resolve => setTimeout(resolve, 500));

    let surveyRecord = null;

    // If district and taluk are provided, verify with complete location
    if (district && taluk) {
      surveyRecord = await Survey.verifySurveyWithLocation(surveyNumber, district, taluk);
      
      if (!surveyRecord) {
        // Try to find the survey number to check if location mismatch
        const surveyExists = await Survey.findBySurveyNumber(surveyNumber);
        
        if (surveyExists) {
          return res.status(400).json({
            success: false,
            message: 'Survey number exists but district/taluk details do not match land records',
            details: {
              expectedDistrict: surveyExists.district,
              expectedTaluk: surveyExists.taluk,
              providedDistrict: district,
              providedTaluk: taluk
            },
            errorCode: 'LOCATION_MISMATCH'
          });
        }
      }
    } else {
      // If only survey number is provided
      surveyRecord = await Survey.findBySurveyNumber(surveyNumber);
    }

    if (surveyRecord) {
      console.log(`✅ Survey number ${surveyNumber} verified successfully from database`);
      
      return res.status(200).json({
        success: true,
        message: 'Survey number verified successfully',
        data: {
          surveyNumber: surveyRecord.surveyNumber,
          district: surveyRecord.district,
          taluk: surveyRecord.taluk,
          landType: surveyRecord.landType,
          area: surveyRecord.area,
          status: surveyRecord.status,
          verified: true,
          verificationDate: new Date().toISOString(),
          lastVerified: surveyRecord.lastVerified
        }
      });
    } else {
      console.log(`❌ Survey number ${surveyNumber} not found in database records`);
      
      return res.status(404).json({
        success: false,
        message: 'Survey number not found in Tamil Nadu land records. Please verify the number or contact the land registration office.',
        errorCode: 'SURVEY_NOT_FOUND'
      });
    }

  } catch (error) {
    console.error('Survey verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Survey verification service temporarily unavailable',
      errorCode: 'VERIFICATION_SERVICE_ERROR'
    });
  }
};

// Get all available survey numbers (for testing purposes only)
const getAvailableSurveyNumbers = async (req, res) => {
  try {
    const { district, limit = 50 } = req.query;
    
    let surveys;
    if (district) {
      surveys = await Survey.getSurveysByDistrict(district, parseInt(limit));
    } else {
      surveys = await Survey.find({ valid: true, status: 'active' })
        .select('surveyNumber district taluk landType area')
        .limit(parseInt(limit))
        .sort({ district: 1, surveyNumber: 1 });
    }

    const validSurveys = surveys.map(record => ({
      surveyNumber: record.surveyNumber,
      district: record.district,
      taluk: record.taluk,
      landType: record.landType,
      area: record.area
    }));

    return res.status(200).json({
      success: true,
      message: district ? `Available survey numbers for ${district} district` : 'Available survey numbers for testing',
      data: validSurveys,
      count: validSurveys.length
    });
  } catch (error) {
    console.error('Get survey numbers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch survey numbers'
    });
  }
};

// Get survey statistics by district
const getSurveyStatistics = async (req, res) => {
  try {
    const stats = await Survey.aggregate([
      { $match: { valid: true, status: 'active' } },
      {
        $group: {
          _id: {
            district: '$district',
            landType: '$landType'
          },
          count: { $sum: 1 },
          totalArea: { $sum: '$area' }
        }
      },
      {
        $group: {
          _id: '$_id.district',
          landTypes: {
            $push: {
              type: '$_id.landType',
              count: '$count',
              totalArea: '$totalArea'
            }
          },
          totalSurveys: { $sum: '$count' },
          totalDistrictArea: { $sum: '$totalArea' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Survey statistics by district',
      data: stats
    });
  } catch (error) {
    console.error('Get survey statistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch survey statistics'
    });
  }
};

module.exports = {
  verifySurveyNumber,
  getAvailableSurveyNumbers,
  getSurveyStatistics
};