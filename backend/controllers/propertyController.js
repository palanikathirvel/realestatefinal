const { validationResult } = require('express-validator');
const Land = require('../models/Land');
const House = require('../models/House');
const Rental = require('../models/Rental');
const Activity = require('../models/Activity');
const User = require('../models/User');
const AdminSettings = require('../models/AdminSettings');
const Survey = require('../models/Survey');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');

// Helper: Base URL for image transformations
const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

// Helper: Transform images to prioritize base64, fallback to URL
const transformImages = (images) => {
  if (!Array.isArray(images)) return [];
  return images.map(img => {
    if (typeof img === 'string') {
      // Legacy string URL
      return {
        url: `${baseUrl}/uploads/${img}`,
        caption: '',
        isPrimary: false,
        base64: undefined,
        mimeType: undefined
      };
    } else if (typeof img === 'object') {
      if (img.base64) {
        // New base64 image, return as-is (data URL ready for img src)
        return {
          ...img,
          url: undefined
        };
      } else if (img.url) {
        // Legacy URL
        const transformedImg = { ...img };
        if (!transformedImg.url.startsWith('http') && !transformedImg.url.startsWith('data:')) {
          transformedImg.url = `${baseUrl}/uploads/${transformedImg.url}`;
        }
        transformedImg.base64 = undefined;
        transformedImg.mimeType = undefined;
        return transformedImg;
      }
    }
    return img;
  });
};

// Helper: Transform video to prioritize base64, fallback to URL
const transformVideo = (video) => {
  if (!video) return null;
  if (typeof video === 'string') {
    // Legacy string URL
    return {
      url: `${baseUrl}/uploads/${video}`,
      caption: '',
      base64: undefined,
      mimeType: undefined
    };
  } else if (typeof video === 'object') {
    if (video.base64) {
      // New base64 video, return as-is (data URL ready for video src)
      return {
        ...video,
        url: undefined
      };
    } else if (video.url) {
      // Legacy URL
      const transformedVideo = { ...video };
      if (!transformedVideo.url.startsWith('http') && !transformedVideo.url.startsWith('data:')) {
        transformedVideo.url = `${baseUrl}/uploads/${transformedVideo.url}`;
      }
      transformedVideo.base64 = undefined;
      transformedVideo.mimeType = undefined;
      return transformedVideo;
    }
  }
  return video;
};

// Helper: map type to model
const modelMap = {
  land: Land,
  house: House,
  rental: Rental
};

const getModelByType = (type) => modelMap[type];

// Find document across models by id
const findByIdAcrossModels = async (id) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) return null;
  const models = [Land, House, Rental];
  for (const M of models) {
    const doc = await M.findById(id).populate('uploadedBy', 'name email phone').lean();
    if (doc) {
      doc._model = M.modelName.toLowerCase();
      return doc;
    }
  }
  return null;
};

// Get all properties for admin (includes unverified properties)
const getAllPropertiesForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const {
      type,
      status,
      district,
      taluk,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = {};

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (status && status !== 'all') {
      if (status === 'pending') {
        filter.verificationStatus = 'pending_verification';
      } else if (status === 'approved') {
        filter.verificationStatus = 'verified';
      } else if (status === 'rejected') {
        filter.verificationStatus = 'rejected';
      }
    }

    if (district) {
      filter['location.district'] = new RegExp(district, 'i');
    }

    if (taluk) {
      filter['location.taluk'] = new RegExp(taluk, 'i');
    }

    // Build sort query
    const sortQuery = {};
    sortQuery[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query across models
    let properties = [];
    let totalProperties = 0;
    if (type && type !== 'all' && modelMap[type]) {
      properties = await modelMap[type].find(filter).populate('uploadedBy', 'name email phone role').sort(sortQuery).skip(skip).limit(limit);
      totalProperties = await modelMap[type].countDocuments(filter);
    } else {
      const [lands, houses, rentals] = await Promise.all([
        Land.find(filter).populate('uploadedBy', 'name email phone role').sort(sortQuery).skip(skip).limit(limit),
        House.find(filter).populate('uploadedBy', 'name email phone role').sort(sortQuery).skip(skip).limit(limit),
        Rental.find(filter).populate('uploadedBy', 'name email phone role').sort(sortQuery).skip(skip).limit(limit)
      ]);
      properties = [...lands, ...houses, ...rentals];
      totalProperties = properties.length;
    }
    const totalPages = Math.ceil(totalProperties / limit);

    // Add status field for frontend compatibility
    const propertiesWithStatus = properties.map(property => {
      const propertyObj = typeof property.toObject === 'function' ? property.toObject() : property;
      const withStatus = {
        ...propertyObj,
        status: propertyObj.verificationStatus === 'pending_verification' ? 'pending' :
          propertyObj.verificationStatus === 'verified' ? 'approved' : 'rejected',
        listedBy: propertyObj.uploadedBy
      };
      // Transform images to full URLs
      withStatus.images = transformImages(withStatus.images);
      // Transform video to full URL
      withStatus.video = transformVideo(withStatus.video);
      return withStatus;
    });

    res.json({
      success: true,
      data: propertiesWithStatus,
      pagination: {
        currentPage: page,
        totalPages,
        totalProperties,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get all properties for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
const getAllProperties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const {
      type,
      district,
      taluk,
      location,
      minPrice,
      maxPrice,
      minSqFt,
      maxSqFt,
      bedrooms,
      bathrooms,
      furnished,
      verified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = {
      verificationStatus: 'verified',
      isActive: true
    };

    // Add search functionality
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'location.district': new RegExp(search, 'i') },
        { 'location.taluk': new RegExp(search, 'i') },
        { 'location.area': new RegExp(search, 'i') },
        { 'location.address': new RegExp(search, 'i') }
      ];
    }

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (district) {
      filter['location.district'] = new RegExp(district, 'i');
    }

    if (taluk) {
      filter['location.taluk'] = new RegExp(taluk, 'i');
    }

    if (location) {
      filter.$or = [
        { 'location.district': new RegExp(location, 'i') },
        { 'location.taluk': new RegExp(location, 'i') },
        { 'location.area': new RegExp(location, 'i') }
      ];
    }

    // Price filtering - handle rental vs sale properties
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = parseInt(minPrice);
      if (maxPrice) priceFilter.$lte = parseInt(maxPrice);
      
      filter.$or = [
        { price: priceFilter }, // For sale properties
        { 'monthlyPayment.amount': priceFilter } // For rental properties
      ];
    }

    if (minSqFt || maxSqFt) {
      filter.squareFeet = {};
      if (minSqFt) filter.squareFeet.$gte = parseInt(minSqFt);
      if (maxSqFt) filter.squareFeet.$lte = parseInt(maxSqFt);
    }

    // Bedrooms filter
    if (bedrooms) {
      filter['features.bedrooms'] = { $gte: parseInt(bedrooms) };
    }

    // Bathrooms filter
    if (bathrooms) {
      filter['features.bathrooms'] = { $gte: parseInt(bathrooms) };
    }

    // Furnished filter
    if (furnished) {
      filter['features.furnished'] = furnished;
    }

    // Verification filter override
    if (verified === 'true') {
      filter.verificationStatus = 'verified';
    } else if (verified === 'false') {
      filter.verificationStatus = { $ne: 'verified' };
    }

    // Build sort query
    const sortQuery = {};
    if (sortBy === 'price_low') {
      sortQuery.price = 1;
    } else if (sortBy === 'price_high') {
      sortQuery.price = -1;
    } else if (sortBy === 'area_large') {
      sortQuery.squareFeet = -1;
    } else if (sortBy === 'area_small') {
      sortQuery.squareFeet = 1;
    } else if (sortBy === 'oldest') {
      sortQuery.createdAt = 1;
    } else {
      sortQuery.createdAt = -1; // newest first (default)
    }

    // Execute query across three collections
    const modelMap = { land: Land, house: House, rental: Rental };

    // If type specified, query only that model
    let properties = [];
    let totalProperties = 0;

    if (type && type !== 'all' && modelMap[type]) {
      properties = await modelMap[type].find(filter).sort(sortQuery).skip(skip).limit(limit).lean();
      totalProperties = await modelMap[type].countDocuments(filter);
    } else {
      // Query all models and merge results
      const [lands, houses, rentals] = await Promise.all([
        Land.find(filter).sort(sortQuery).lean(),
        House.find(filter).sort(sortQuery).lean(),
        Rental.find(filter).sort(sortQuery).lean()
      ]);
      
      // Combine and sort all properties
      const allProperties = [...lands, ...houses, ...rentals];
      
      // Apply pagination to combined results
      properties = allProperties.slice(skip, skip + limit);
      totalProperties = allProperties.length;
    }
    const totalPages = Math.ceil(totalProperties / limit);

    // Hide owner details for non-authenticated users
    const sanitizedProperties = properties.map(property => {
      const propertyObj = typeof property.toObject === 'function' ? property.toObject() : property;
      const { ownerDetails, ...propertyWithoutOwner } = propertyObj;
      const sanitized = {
        ...propertyWithoutOwner,
        hasOwnerDetails: !!(ownerDetails && ownerDetails.phone)
      };
      // Transform images to full URLs
      sanitized.images = transformImages(sanitized.images);
      // Transform video to full URL
      sanitized.video = transformVideo(sanitized.video);
      return sanitized;
    });

    res.json({
      success: true,
      data: {
        properties: sanitizedProperties,
        total: totalProperties,
        totalPages,
        pagination: {
          currentPage: page,
          totalPages,
          totalProperties,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get property by ID with view tracking
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await findByIdAcrossModels(id);

    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    // Check verificationStatus if present
    if (property.verificationStatus && property.verificationStatus !== 'verified' && (!req.user || req.user.role !== 'admin')) {
      if (!req.user || (req.user.role !== 'agent' || property.uploadedBy._id.toString() !== req.user._id.toString())) {
        return res.status(403).json({ success: false, message: 'Property not available' });
      }
    }

    // Increment view count (non-blocking) if model supports it
    setImmediate(async () => {
      try {
        const M = getModelByType(property._model) || null;
        if (M) {
          await M.findByIdAndUpdate(property._id, { $inc: { views: 1 } });
        }
        if (req.user) {
          await Activity.logActivity({
            action: 'property_view',
            userId: req.user._id,
            propertyId: property._id,
            category: 'property',
            details: `Viewed property: ${property.title}`,
            metadata: { ipAddress: req.ip, userAgent: req.get('User-Agent') }
          });
        }
      } catch (error) {
        console.error('Error updating view count:', error);
      }
    });

    // Prepare property data (handle lean/plain objects)
    let propertyData = typeof property.toObject === 'function' ? property.toObject() : property;
    if (!req.user || req.user.role !== 'admin') {
      const { ownerDetails, ...propertyWithoutOwner } = propertyData;
      propertyData = {
        ...propertyWithoutOwner,
        hasOwnerDetails: !!(ownerDetails && ownerDetails.phone)
      };
    }

    // Transform images to full URLs
    propertyData.images = transformImages(propertyData.images);
    // Transform video to full URL
    propertyData.video = transformVideo(propertyData.video);

    res.json({
      success: true,
      data: {
        property: propertyData
      }
    });

  } catch (error) {
    console.error('Get property by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const createProperty = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let propertyData = {
      ...req.body,
      uploadedBy: req.user._id,
      verificationStatus: 'pending_verification'
    };

    // Transform specialRooms for House if array of strings
    if (propertyData.type === 'house' && propertyData.features && propertyData.features.specialRooms && Array.isArray(propertyData.features.specialRooms)) {
      propertyData.features.specialRooms = propertyData.features.specialRooms.map(room => {
        if (typeof room === 'string') {
          return { name: room, sizeSqFt: null, photos: [] };
        }
        return room; // Already an object
      });
    }

    // Validate images for base64 (new format) or URL (legacy)
    if (!propertyData.images || propertyData.images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }
    // Ensure each image has either base64 or url
    const hasValidImages = propertyData.images.every(img => 
      (typeof img === 'object' && (img.base64 || img.url)) || typeof img === 'string'
    );
    if (!hasValidImages) {
      return res.status(400).json({
        success: false,
        message: 'Each image must have base64 or url field'
      });
    }

    // Transform incoming images to match schema (set base64 if data URL, or url for legacy)
    if (propertyData.images && Array.isArray(propertyData.images)) {
      propertyData.images = propertyData.images.map(img => {
        if (typeof img === 'string') {
          // Legacy string URL
          return {
            base64: undefined,
            url: img.startsWith('http') ? img : `${baseUrl}/uploads/${img}`,
            caption: img.caption || '',
            isPrimary: img.isPrimary || false,
            mimeType: undefined
          };
        } else if (typeof img === 'object') {
          if (img.url && img.url.startsWith('data:')) {
            // Data URL from frontend upload, treat as base64
            return {
              base64: img.url,
              url: undefined,
              caption: img.caption || '',
              isPrimary: img.isPrimary || false,
              mimeType: img.mimeType
            };
          } else if (img.base64) {
            // Already base64
            return {
              ...img,
              url: undefined
            };
          } else if (img.url) {
            // Regular URL
            return {
              ...img,
              url: img.url.startsWith('http') ? img.url : `${baseUrl}/uploads/${img.url}`,
              base64: undefined,
              mimeType: undefined
            };
          }
        }
        return img;
      });
    }

    // Transform incoming video to match schema (set base64 if data URL, or url for legacy)
    if (propertyData.video) {
      if (typeof propertyData.video === 'string') {
        // Legacy string URL
        propertyData.video = {
          base64: undefined,
          url: propertyData.video.startsWith('http') ? propertyData.video : `${baseUrl}/uploads/${propertyData.video}`,
          caption: '',
          mimeType: undefined
        };
      } else if (typeof propertyData.video === 'object') {
        if (propertyData.video.url && propertyData.video.url.startsWith('data:')) {
          // Data URL from frontend upload, treat as base64
          propertyData.video = {
            base64: propertyData.video.url,
            url: undefined,
            caption: propertyData.video.caption || '',
            mimeType: propertyData.video.mimeType
          };
        } else if (propertyData.video.base64) {
          // Already base64
          propertyData.video = {
            ...propertyData.video,
            url: undefined
          };
        } else if (propertyData.video.url) {
          // Regular URL
          propertyData.video = {
            ...propertyData.video,
            url: propertyData.video.url.startsWith('http') ? propertyData.video.url : `${baseUrl}/uploads/${propertyData.video.url}`,
            base64: undefined,
            mimeType: undefined
          };
        }
      }
    }

    // Transform geoTagPhoto for house if present
    if (propertyData.type === 'house' && propertyData.geoTagPhoto) {
      if (typeof propertyData.geoTagPhoto === 'object') {
        if (propertyData.geoTagPhoto.url && propertyData.geoTagPhoto.url.startsWith('data:')) {
          propertyData.geoTagPhoto = {
            base64: propertyData.geoTagPhoto.url,
            mimeType: propertyData.geoTagPhoto.mimeType,
            uploadedAt: new Date(),
            url: undefined
          };
        } else if (propertyData.geoTagPhoto.base64) {
          propertyData.geoTagPhoto.url = undefined;
        } else if (propertyData.geoTagPhoto.url) {
          propertyData.geoTagPhoto = {
            ...propertyData.geoTagPhoto,
            url: propertyData.geoTagPhoto.url.startsWith('http') ? propertyData.geoTagPhoto.url : `${baseUrl}/uploads/${propertyData.geoTagPhoto.url}`,
            base64: undefined,
            uploadedAt: new Date()
          };
        }
      }
    }

    // Transform agreement for rental if present
    if (propertyData.type === 'rental' && propertyData.agreement) {
      if (typeof propertyData.agreement === 'object') {
        if (propertyData.agreement.url && propertyData.agreement.url.startsWith('data:')) {
          propertyData.agreement = {
            base64: propertyData.agreement.url,
            mimeType: propertyData.agreement.mimeType,
            uploadedAt: new Date(),
            url: undefined
          };
        } else if (propertyData.agreement.base64) {
          propertyData.agreement.url = undefined;
        } else if (propertyData.agreement.url) {
          propertyData.agreement = {
            ...propertyData.agreement,
            url: propertyData.agreement.url.startsWith('http') ? propertyData.agreement.url : `${baseUrl}/uploads/${propertyData.agreement.url}`,
            base64: undefined,
            uploadedAt: new Date()
          };
        }
      }
    }

    // For land, add facilities if provided (fix frontend inconsistency)
    if (propertyData.type === 'land' && propertyData.facilities) {
      propertyData.facilities = propertyData.facilities;
    }

    // Choose model by type
    const Model = getModelByType(propertyData.type);
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid or missing property type' });
    }
    const property = new Model(propertyData);
    await property.save();

    // ✨ AUTO VERIFICATION LOGIC ✨
    let autoVerificationAttempted = false;
    let autoVerificationSuccess = false;
    let verificationDetails = null;

    try {
      // Check if auto verification is enabled
      const verificationMode = await AdminSettings.getVerificationMode();
      console.log(`🔧 Current verification mode: ${verificationMode}`);

      if (verificationMode === 'auto' && property.surveyNumber) {
        console.log(`🤖 Attempting auto verification for survey: ${property.surveyNumber}`);
        autoVerificationAttempted = true;

        // Verify survey number with location details
        const surveyRecord = await Survey.verifySurveyWithLocation(
          property.surveyNumber, 
          property.location.district, 
          property.location.taluk
        );

        if (surveyRecord) {
          // Auto verification successful
          property.verificationStatus = 'verified';
          property.verificationDetails = {
            autoVerified: true,
            verifiedAt: new Date(),
            verificationMethod: 'survey_api',
            surveyData: {
              surveyNumber: surveyRecord.surveyNumber,
              district: surveyRecord.district,
              taluk: surveyRecord.taluk,
              landType: surveyRecord.landType,
              area: surveyRecord.area,
              status: surveyRecord.status
            },
            verificationNotes: `Auto-verified via survey number API on ${new Date().toISOString()}`
          };
          
          await property.save();
          autoVerificationSuccess = true;
          verificationDetails = property.verificationDetails.surveyData;

          console.log(`✅ Auto verification successful for ${property.surveyNumber}`);

          // Send notification to agent about auto verification
          try {
            await Notification.create({
              userId: req.user._id,
              type: 'property_verified',
              title: 'Property Auto-Verified! 🎉',
              message: `Your property "${property.title}" has been automatically verified and is now live!`,
              data: {
                propertyId: property._id,
                propertyTitle: property.title,
                verificationType: 'auto',
                surveyNumber: property.surveyNumber
              }
            });
          } catch (notifError) {
            console.log('Notification creation failed:', notifError);
          }

        } else {
          // Survey not found or location mismatch - reject property
          const surveyExists = await Survey.findBySurveyNumber(property.surveyNumber);
          
          if (surveyExists) {
            // Location mismatch
            property.verificationStatus = 'rejected';
            property.verificationDetails = {
              autoVerified: false,
              rejectedAt: new Date(),
              rejectionReason: 'Location mismatch',
              verificationMethod: 'survey_api',
              rejectionNotes: `Survey number ${property.surveyNumber} exists but location details do not match. Expected: ${surveyExists.district}, ${surveyExists.taluk}. Provided: ${property.location.district}, ${property.location.taluk}`
            };
          } else {
            // Survey not found
            property.verificationStatus = 'rejected';
            property.verificationDetails = {
              autoVerified: false,
              rejectedAt: new Date(),
              rejectionReason: 'Survey number not found',
              verificationMethod: 'survey_api',
              rejectionNotes: `Survey number ${property.surveyNumber} not found in Tamil Nadu land records database`
            };
          }
          
          await property.save();
          console.log(`❌ Auto verification rejected for ${property.surveyNumber}`);

          // Send notification to agent about rejection
          try {
            await Notification.create({
              userId: req.user._id,
              type: 'property_rejected',
              title: 'Property Auto-Rejected ❌',
              message: `Your property "${property.title}" was rejected due to invalid survey number.`,
              data: {
                propertyId: property._id,
                propertyTitle: property.title,
                verificationType: 'auto',
                rejectionReason: property.verificationDetails.rejectionReason,
                surveyNumber: property.surveyNumber
              }
            });
          } catch (notifError) {
            console.log('Notification creation failed:', notifError);
          }
        }
      }
    } catch (autoVerifyError) {
      console.error('Auto verification error:', autoVerifyError);
      // If auto verification fails, keep property as pending for manual review
      autoVerificationAttempted = true;
      autoVerificationSuccess = false;
    }

    // Log property upload activity with verification results
    await Activity.logActivity({
      action: 'property_upload',
      userId: req.user._id,
      propertyId: property._id,
      category: 'property',
      details: `Uploaded ${property.type} property: ${property.title} in ${property.location.district} - ${autoVerificationAttempted ? (autoVerificationSuccess ? 'Auto-verified and live' : 'Auto-rejected') : 'Pending admin verification'}`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        propertyType: property.type,
        location: property.location.district,
        verificationStatus: property.verificationStatus,
        surveyNumber: property.surveyNumber,
        autoVerificationAttempted,
        autoVerificationSuccess,
        verificationMode: await AdminSettings.getVerificationMode()
      }
    });

    // Populate upload user info where applicable
    try { await property.populate && await property.populate('uploadedBy', 'name email phone'); } catch (e) { }

    // Transform images and video for the response
    const responsePropertyData = typeof property.toObject === 'function' ? property.toObject() : property;
    responsePropertyData.images = transformImages(responsePropertyData.images);
    responsePropertyData.video = transformVideo(responsePropertyData.video);

    // Dynamic response message based on verification result
    let responseMessage;
    let statusCode = 201;

    if (autoVerificationAttempted) {
      if (autoVerificationSuccess) {
        responseMessage = '🎉 Property uploaded and automatically verified! Your property is now live and visible to users.';
      } else {
        responseMessage = '❌ Property upload failed auto verification. Please check your survey number and location details.';
        statusCode = 400; // Bad request due to invalid survey data
      }
    } else {
      responseMessage = '📋 Property uploaded successfully! It has been submitted for admin verification and will be live once approved.';
    }

    res.status(statusCode).json({
      success: autoVerificationAttempted ? autoVerificationSuccess : true,
      message: responseMessage,
      data: {
        property: responsePropertyData,
        verification: {
          attempted: autoVerificationAttempted,
          successful: autoVerificationSuccess,
          status: property.verificationStatus,
          mode: await AdminSettings.getVerificationMode(),
          details: verificationDetails
        }
      }
    });

  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update property (Owner or Admin)
const updateProperty = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    let updateData = req.body;

    // Prevent status updates by agents
    if (req.user.role !== 'admin') {
      delete updateData.verificationStatus;
      delete updateData.verificationDetails;
    }

    // Transform specialRooms for House if array of strings
    if (updateData.type === 'house' && updateData.features && updateData.features.specialRooms && Array.isArray(updateData.features.specialRooms)) {
      updateData.features.specialRooms = updateData.features.specialRooms.map(room => {
        if (typeof room === 'string') {
          return { name: room, sizeSqFt: null, photos: [] };
        }
        return room; // Already an object
      });
    }

    // Filter features to only include schema-allowed fields for each type
    if (updateData.type === 'house' && updateData.features) {
      const allowedFields = ['noOfRooms', 'rooms', 'specialRooms', 'furnished', 'amenities'];
      const filteredFeatures = {};
      allowedFields.forEach(field => {
        if (updateData.features[field] !== undefined) {
          filteredFeatures[field] = updateData.features[field];
        }
      });
      updateData.features = filteredFeatures;
    }

    if (updateData.type === 'land' && updateData.features) {
      // Land doesn't have features in schema, remove it
      delete updateData.features;
    }

    if (updateData.type === 'rental' && updateData.features) {
      const allowedFields = ['furnished', 'amenities'];
      const filteredFeatures = {};
      allowedFields.forEach(field => {
        if (updateData.features[field] !== undefined) {
          filteredFeatures[field] = updateData.features[field];
        }
      });
      updateData.features = filteredFeatures;
    }

    console.log('Update data:', JSON.stringify(updateData, null, 2));

    // Transform incoming images to match schema if provided
    if (updateData.images && Array.isArray(updateData.images)) {
      updateData.images = updateData.images.map(img => {
        if (typeof img === 'string') {
          // Legacy string URL
          return {
            base64: undefined,
            url: img.startsWith('http') ? img : `${baseUrl}/uploads/${img}`,
            caption: img.caption || '',
            isPrimary: img.isPrimary || false,
            mimeType: undefined
          };
        } else if (typeof img === 'object') {
          if (img.url && img.url.startsWith('data:')) {
            // Data URL from frontend upload, treat as base64
            return {
              base64: img.url,
              url: undefined,
              caption: img.caption || '',
              isPrimary: img.isPrimary || false,
              mimeType: img.mimeType
            };
          } else if (img.base64) {
            // Already base64
            return {
              ...img,
              url: undefined
            };
          } else if (img.url) {
            // Regular URL
            return {
              ...img,
              url: img.url.startsWith('http') ? img.url : `${baseUrl}/uploads/${img.url}`,
              base64: undefined,
              mimeType: undefined
            };
          }
        }
        return img;
      });
    }

    // Transform incoming video to match schema if provided
    if (updateData.video) {
      if (typeof updateData.video === 'string') {
        // Legacy string URL
        updateData.video = {
          base64: undefined,
          url: updateData.video.startsWith('http') ? updateData.video : `${baseUrl}/uploads/${updateData.video}`,
          caption: '',
          mimeType: undefined
        };
      } else if (typeof updateData.video === 'object') {
        if (updateData.video.url && updateData.video.url.startsWith('data:')) {
          // Data URL from frontend upload, treat as base64
          updateData.video = {
            base64: updateData.video.url,
            url: undefined,
            caption: updateData.video.caption || '',
            mimeType: updateData.video.mimeType
          };
        } else if (updateData.video.base64) {
          // Already base64
          updateData.video = {
            ...updateData.video,
            url: undefined
          };
        } else if (updateData.video.url) {
          // Regular URL
          updateData.video = {
            ...updateData.video,
            url: updateData.video.url.startsWith('http') ? updateData.video.url : `${baseUrl}/uploads/${updateData.video.url}`,
            base64: undefined,
            mimeType: undefined
          };
        }
      }
    }

    // Transform geoTagPhoto for house if provided
    if (updateData.type === 'house' && updateData.geoTagPhoto) {
      if (typeof updateData.geoTagPhoto === 'object') {
        if (updateData.geoTagPhoto.url && updateData.geoTagPhoto.url.startsWith('data:')) {
          updateData.geoTagPhoto = {
            base64: updateData.geoTagPhoto.url,
            mimeType: updateData.geoTagPhoto.mimeType,
            uploadedAt: new Date(),
            url: undefined
          };
        } else if (updateData.geoTagPhoto.base64) {
          updateData.geoTagPhoto.url = undefined;
        } else if (updateData.geoTagPhoto.url) {
          updateData.geoTagPhoto = {
            ...updateData.geoTagPhoto,
            url: updateData.geoTagPhoto.url.startsWith('http') ? updateData.geoTagPhoto.url : `${baseUrl}/uploads/${updateData.geoTagPhoto.url}`,
            base64: undefined,
            uploadedAt: new Date()
          };
        }
      }
    }

    // Transform agreement for rental if provided
    if (updateData.type === 'rental' && updateData.agreement) {
      if (typeof updateData.agreement === 'object') {
        if (updateData.agreement.url && updateData.agreement.url.startsWith('data:')) {
          updateData.agreement = {
            base64: updateData.agreement.url,
            mimeType: updateData.agreement.mimeType,
            uploadedAt: new Date(),
            url: undefined
          };
        } else if (updateData.agreement.base64) {
          updateData.agreement.url = undefined;
        } else if (updateData.agreement.url) {
          updateData.agreement = {
            ...updateData.agreement,
            url: updateData.agreement.url.startsWith('http') ? updateData.agreement.url : `${baseUrl}/uploads/${updateData.agreement.url}`,
            base64: undefined,
            uploadedAt: new Date()
          };
        }
      }
    }

    // Find which model contains the document and update
    let updated = null;
    const models = [Land, House, Rental];
    for (const M of models) {
      try {
        updated = await M.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (updated) {
          try { await updated.populate('uploadedBy', 'name email phone'); } catch (e) { }
          break;
        }
      } catch (modelError) {
        console.error(`Error updating ${M.modelName}:`, modelError);
        // Continue to next model if this one fails
      }
    }
    const property = updated;

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Log property update activity
    await Activity.logActivity({
      action: 'property_edit',
      userId: req.user._id,
      propertyId: property._id,
      category: 'property',
      details: `Updated property: ${property.title}`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        updatedFields: Object.keys(updateData)
      }
    });

    // Transform images and video for the response
    const propertyData = typeof property.toObject === 'function' ? property.toObject() : property;
    propertyData.images = transformImages(propertyData.images);
    propertyData.video = transformVideo(propertyData.video);

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: {
        property: propertyData
      }
    });

    } catch (error) {
      console.error('Update property error:', error);
      console.error('Error details:', error.errors);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to update property',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        details: process.env.NODE_ENV === 'development' ? error.errors : undefined
      });
    }
};

// Delete property (Owner or Admin)
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = null;
    const models = [Land, House, Rental];
    for (const M of models) {
      deleted = await M.findByIdAndDelete(id);
      if (deleted) break;
    }

    if (!deleted) return res.status(404).json({ success: false, message: 'Property not found' });

    // Log property deletion activity (use deleted document data)
    try {
      await Activity.logActivity({
        action: 'property_delete',
        userId: req.user._id,
        propertyId: deleted._id,
        category: 'property',
        details: `Deleted property: ${deleted.title}`,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          propertyType: deleted.type,
          location: deleted.location && deleted.location.district
        }
      });
    } catch (logErr) {
      console.error('Failed to log delete activity:', logErr);
    }

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });

  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get agent's properties
const getAgentProperties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, type } = req.query;

    const filter = { uploadedBy: req.user._id };

    if (status) {
      filter.verificationStatus = status;
    }

    if (type && type !== 'all') {
      filter.type = type;
    }

    // Aggregate results from all models
    const queries = [Land.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    House.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Rental.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)];
    const [lands, houses, rentals] = await Promise.all(queries);
    const properties = [...lands, ...houses, ...rentals].map(property => {
      const propertyObj = typeof property.toObject === 'function' ? property.toObject() : property;
      // Transform images to full URLs
      propertyObj.images = transformImages(propertyObj.images);
      // Transform video to full URL
      propertyObj.video = transformVideo(propertyObj.video);
      return propertyObj;
    });
    const totalProperties = properties.length; // simple sum for now
    const totalPages = Math.ceil(totalProperties / limit);

    // Get status counts
    // Get status counts across models
    const statusCountsAgg = [];
    const models = [Land, House, Rental];
    for (const M of models) {
      const agg = await M.aggregate([{ $match: { uploadedBy: req.user._id } }, { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }]);
      statusCountsAgg.push(...agg);
    }

    const statusCounts = statusCountsAgg.reduce((acc, item) => {
      acc[item._id] = (acc[item._id] || 0) + item.count;
      return acc;
    }, {});

    const counts = {
      total: totalProperties,
      pending_verification: 0,
      verified: 0,
      rejected: 0
    };

    // statusCounts is an object map: { status: count }
    Object.keys(statusCounts).forEach(key => {
      counts[key] = statusCounts[key];
    });

    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          currentPage: page,
          totalPages,
          totalProperties,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        statusCounts: counts
      }
    });

  } catch (error) {
    console.error('Get agent properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent properties',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get properties by type
const getPropertiesByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!['land', 'house', 'rental'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property type'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const M = getModelByType(type);
    const properties = await M.find({ verificationStatus: 'verified', isActive: true }).skip(skip).limit(limit).sort({ createdAt: -1 }).lean();
    const totalProperties = await M.countDocuments({ verificationStatus: 'verified', isActive: true });

    const totalPages = Math.ceil(totalProperties / limit);

    // Hide owner details
    const sanitizedProperties = properties.map(property => {
      const propertyObj = typeof property.toObject === 'function' ? property.toObject() : property;
      const { ownerDetails, ...propertyWithoutOwner } = propertyObj;
      const sanitized = {
        ...propertyWithoutOwner,
        hasOwnerDetails: !!(ownerDetails && ownerDetails.phone)
      };
      // Transform images to full URLs
      sanitized.images = transformImages(sanitized.images);
      // Transform video to full URL
      sanitized.video = transformVideo(sanitized.video);
      return sanitized;
    });

    res.json({
      success: true,
      data: {
        properties: sanitizedProperties,
        type,
        pagination: {
          currentPage: page,
          totalPages,
          totalProperties,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get properties by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user favorites
const getUserFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('favorites');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        favorites: user.favorites || []
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get favorites',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add property to favorites
const addToFavorites = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.userId;

    // Check if property exists across models
    const property = await findByIdAcrossModels(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Add to user favorites
    const user = await User.findById(userId);
    if (!user.favorites) {
      user.favorites = [];
    }

    if (!user.favorites.includes(propertyId)) {
      user.favorites.push(propertyId);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Property added to favorites'
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to favorites',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Remove property from favorites
const removeFromFavorites = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.userId;

    // Remove from user favorites
    const user = await User.findById(userId);
    if (user.favorites) {
      user.favorites = user.favorites.filter(id => id.toString() !== propertyId);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Property removed from favorites'
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const approveProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body; // optional verificationNotes

    const property = await findByIdAcrossModels(id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const Model = getModelByType(property._model);
    const updated = await Model.findByIdAndUpdate(
      id,
      {
        verificationStatus: 'verified',
        'verificationDetails.verifiedBy': req.user._id,
        'verificationDetails.verifiedAt': new Date(),
        ...(notes && { 'verificationDetails.verificationNotes': notes })
      },
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email phone');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Log activity
    await Activity.logActivity({
      action: 'property_approve',
      userId: req.user._id,
      propertyId: id,
      category: 'property',
      details: `Approved property: ${updated.title}`,
      metadata: { 
        notes,
        propertyType: updated.type,
        location: updated.location?.district
      }
    });

    // Transform images and video for the response
    const propertyData = typeof updated.toObject === 'function' ? updated.toObject() : updated;
    propertyData.images = transformImages(propertyData.images);
    propertyData.video = transformVideo(propertyData.video);

    res.json({
      success: true,
      message: 'Property approved successfully',
      data: { property: propertyData }
    });
  } catch (error) {
    console.error('Approve property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve property',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const rejectProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // required rejectionReason

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason must be at least 10 characters long'
      });
    }

    const property = await findByIdAcrossModels(id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const Model = getModelByType(property._model);
    const updated = await Model.findByIdAndUpdate(
      id,
      {
        verificationStatus: 'rejected',
        'verificationDetails.verifiedBy': req.user._id,
        'verificationDetails.verifiedAt': new Date(),
        'verificationDetails.rejectionReason': reason.trim()
      },
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email phone');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Log activity
    await Activity.logActivity({
      action: 'property_reject',
      userId: req.user._id,
      propertyId: id,
      category: 'property',
      details: `Rejected property: ${updated.title}`,
      metadata: { 
        reason,
        propertyType: updated.type,
        location: updated.location?.district
      }
    });

    // Transform images and video for the response
    const propertyData = typeof updated.toObject === 'function' ? updated.toObject() : updated;
    propertyData.images = transformImages(propertyData.images);
    propertyData.video = transformVideo(propertyData.video);

    res.json({
      success: true,
      message: 'Property rejected successfully',
      data: { property: propertyData }
    });
  } catch (error) {
    console.error('Reject property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject property',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Send contact message to property agent
const sendContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, message: messageText } = req.body;

    // Validate required fields
    if (!name || !email || !messageText) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if property exists
    const property = await findByIdAcrossModels(id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Get sender user (if authenticated)
    let senderId = null;
    if (req.user) {
      senderId = req.user._id;
    }

    // Get recipient (property agent)
    const recipientId = property.uploadedBy._id || property.uploadedBy;

    // Create message
    const newMessage = new Message({
      sender: senderId,
      recipient: recipientId,
      property: id,
      subject: `Inquiry about ${property.title}`,
      message: messageText,
      senderName: name,
      senderEmail: email,
      senderPhone: phone || ''
    });

    await newMessage.save();

    // Create notification for agent (only for authenticated users)
    if (senderId) {
      try {
        await Notification.create({
          initiator: senderId,
          recipient: recipientId,
          property: id,
          type: 'message',
          title: 'New Property Inquiry',
          message: `${name} is interested in your property "${property.title}"`,
          metadata: {
            messageId: newMessage._id,
            senderName: name,
            senderEmail: email
          },
          status: 'unread'
        });
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the request if notification creation fails
      }
    }

    // Send email notification to agent
    try {
      const agent = await User.findById(recipientId);
      if (agent && agent.email) {
        await emailService.sendEmail({
          to: agent.email,
          subject: `New Property Inquiry - ${property.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">New Property Inquiry</h2>
              <p><strong>Property:</strong> ${property.title}</p>
              <p><strong>Location:</strong> ${property.location?.district || 'N/A'}, ${property.location?.taluk || 'N/A'}</p>
              <p><strong>From:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
              <p><strong>Message:</strong></p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 10px 0;">
                ${messageText.replace(/\n/g, '<br>')}
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Please login to your dashboard to view and respond to this inquiry.
              </p>
            </div>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request if email sending fails
    }

    // Log activity
    if (req.user) {
      await Activity.logActivity({
        action: 'message_sent',
        userId: req.user._id,
        propertyId: id,
        category: 'communication',
        details: `Sent inquiry message for property: ${property.title}`,
        metadata: {
          recipientId,
          messageId: newMessage._id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! The agent will get back to you soon.',
      data: {
        messageId: newMessage._id
      }
    });

  } catch (error) {
    console.error('Send contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
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
};
