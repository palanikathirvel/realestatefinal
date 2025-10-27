const { validationResult } = require('express-validator');
const User = require('../models/User');
const Land = require('../models/Land');
const House = require('../models/House');
const Rental = require('../models/Rental');
const Activity = require('../models/Activity');
const OTP = require('../models/OTP');
const AdminSettings = require('../models/AdminSettings');

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Set your admin credentials here
    const ADMIN_USEREMAIL = 'admin@realestate.com';
    const ADMIN_PASSWORD = 'admin123';

    if (email === ADMIN_USEREMAIL && password === ADMIN_PASSWORD) {
      // Check if admin user exists, if not create one
      let adminUser = await User.findOne({ email: ADMIN_USEREMAIL });

      if (!adminUser) {
        adminUser = new User({
          name: 'Administrator',
          email: ADMIN_USEREMAIL,
          password: ADMIN_PASSWORD, // This will be hashed by the pre-save hook
          role: 'admin',
          status: 'active',
          emailVerified: true,
          verifiedAt: new Date()
        });
        await adminUser.save();
      }

      // Generate admin token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: adminUser._id, role: 'admin', email: ADMIN_USEREMAIL },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Log admin login activity
      await Activity.logActivity({
        action: 'admin_login',
        userId: adminUser._id,
        category: 'admin',
        details: 'Admin logged in successfully',
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          adminEmail: ADMIN_USEREMAIL
        }
      });

      return res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          token,
          user: {
            id: adminUser._id,
            email: ADMIN_USEREMAIL,
            role: 'admin',
            name: 'Administrator'
          }
        }
      });
    } else {
      // If not admin, check if user exists and redirect to user page
      const user = await User.findOne({ email, password });
      if (user) {
        return res.json({ success: true, message: 'User login successful', redirect: '/user/home', user });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

// Admin Dashboard Overview
const getDashboardOverview = async (req, res) => {
  try {
    // Get counts for different entities across models
    const [
      totalUsers,
      totalAgents,
      landTotal,
      landPending,
      landVerified,
      landRejected,
      houseTotal,
      housePending,
      houseVerified,
      houseRejected,
      rentalTotal,
      rentalPending,
      rentalVerified,
      rentalRejected,
      todayActivities,
      recentOTPs
    ] = await Promise.all([
      User.countDocuments({ role: 'user', status: 'active' }),
      User.countDocuments({ role: 'agent', status: 'active' }),
      Land.countDocuments(),
      Land.countDocuments({ verificationStatus: 'pending_verification' }),
      Land.countDocuments({ verificationStatus: 'verified' }),
      Land.countDocuments({ verificationStatus: 'rejected' }),
      House.countDocuments(),
      House.countDocuments({ verificationStatus: 'pending_verification' }),
      House.countDocuments({ verificationStatus: 'verified' }),
      House.countDocuments({ verificationStatus: 'rejected' }),
      Rental.countDocuments(),
      Rental.countDocuments({ verificationStatus: 'pending_verification' }),
      Rental.countDocuments({ verificationStatus: 'verified' }),
      Rental.countDocuments({ verificationStatus: 'rejected' }),
      Activity.countDocuments({
        timestamp: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      OTP.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      })
    ]);

    const totalProperties = landTotal + houseTotal + rentalTotal;
    const pendingProperties = landPending + housePending + rentalPending;
    const verifiedProperties = landVerified + houseVerified + rentalVerified;
    const rejectedProperties = landRejected + houseRejected + rentalRejected;

    // Get property statistics by type
    const propertyStats = [
      {
        _id: 'land',
        total: landTotal,
        verified: landVerified,
        pending: landPending
      },
      {
        _id: 'house',
        total: houseTotal,
        verified: houseVerified,
        pending: housePending
      },
      {
        _id: 'rental',
        total: rentalTotal,
        verified: rentalVerified,
        pending: rentalPending
      }
    ];

    // Get recent activities
    const recentActivitiesRaw = await Activity.find()
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(10);

    // Manually populate property details across models
    const recentActivities = await Promise.all(
      recentActivitiesRaw.map(async (activity) => {
        let propertyTitle = null;
        let propertyType = null;
        if (activity.propertyId) {
          let property = await Land.findById(activity.propertyId).select('title type').lean();
          if (!property) {
            property = await House.findById(activity.propertyId).select('title type').lean();
          }
          if (!property) {
            property = await Rental.findById(activity.propertyId).select('title type').lean();
          }
          if (property) {
            propertyTitle = property.title;
            propertyType = property.type;
          }
        }
        const activityObj = activity.toObject();
        activityObj.property = { title: propertyTitle, type: propertyType };
        activityObj.getFormattedActivity = () => `${activity.action} - ${activity.details} ${propertyTitle ? `(${propertyTitle})` : ''}`;
        return activityObj;
      })
    );

    // Get user registration trends (last 7 days)
    const userTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          users: {
            total: totalUsers,
            agents: totalAgents,
            regularUsers: totalUsers
          },
          properties: {
            total: totalProperties,
            pending: pendingProperties,
            verified: verifiedProperties,
            rejected: rejectedProperties
          },
          activity: {
            todayActivities,
            recentOTPs
          }
        },
        propertyStats,
        recentActivities: recentActivities.map(activity => activity.getFormattedActivity()),
        userTrends
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Property Verification Management
const getPendingProperties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const {
      type,
      district,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = { verificationStatus: 'pending_verification' };

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (district) {
      filter['location.district'] = new RegExp(district, 'i');
    }

    // Build sort query
    const sortQuery = {};
    sortQuery[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let properties = [];
    let totalProperties = 0;

    const modelMap = { land: Land, house: House, rental: Rental };

    if (type && type !== 'all' && modelMap[type]) {
      // Query specific model
      properties = await modelMap[type].find(filter)
        .populate('uploadedBy', 'name email phone createdAt')
        .sort(sortQuery)
        .skip(skip)
        .limit(limit);
      totalProperties = await modelMap[type].countDocuments(filter);
    } else {
      // Query all models and merge
      const [lands, houses, rentals] = await Promise.all([
        Land.find(filter).populate('uploadedBy', 'name email phone createdAt'),
        House.find(filter).populate('uploadedBy', 'name email phone createdAt'),
        Rental.find(filter).populate('uploadedBy', 'name email phone createdAt')
      ]);

      properties = [...lands, ...houses, ...rentals];

      // Sort the merged array
      properties.sort((a, b) => {
        const aVal = a[sortBy] ? new Date(a[sortBy]) : new Date(0);
        const bVal = b[sortBy] ? new Date(b[sortBy]) : new Date(0);
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });

      // Total count before pagination
      totalProperties = properties.length;

      // Apply pagination to sorted array
      properties = properties.slice(skip, skip + limit);
    }

    const totalPages = Math.ceil(totalProperties / limit);

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
        }
      }
    });

  } catch (error) {
    console.error('Get pending properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending properties',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify Property
const verifyProperty = async (req, res) => {
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
    const { status, verificationNotes } = req.body;

    // Find property in the correct model
    let property = null;
    let Model = null;

    // Try to find in each model
    property = await Land.findById(id).populate('uploadedBy', 'name email');
    if (property) {
      Model = Land;
    } else {
      property = await House.findById(id).populate('uploadedBy', 'name email');
      if (property) {
        Model = House;
      } else {
        property = await Rental.findById(id).populate('uploadedBy', 'name email');
        if (property) {
          Model = Rental;
        }
      }
    }

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (property.verificationStatus !== 'pending_verification') {
      return res.status(400).json({
        success: false,
        message: 'Property is not in pending verification status'
      });
    }

    // Update property verification status
    property.verificationStatus = status;
    property.verificationDetails = {
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
      verificationNotes
    };

    if (status === 'rejected') {
      property.verificationDetails.rejectionReason = verificationNotes;
    }

    await property.save();

    // Log verification activity
    await Activity.logActivity({
      action: 'property_verification',
      userId: req.user._id,
      propertyId: property._id,
      targetUserId: property.uploadedBy._id,
      category: 'admin',
      details: `Property ${status}: ${property.title} - ${verificationNotes || 'No notes'}`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        verificationStatus: status,
        propertyType: property.type,
        location: property.location.district,
        agentEmail: property.uploadedBy.email
      }
    });

    res.json({
      success: true,
      message: `Property ${status} successfully`,
      data: {
        property: {
          id: property._id,
          title: property.title,
          type: property.type,
          verificationStatus: property.verificationStatus,
          verificationDetails: property.verificationDetails
        }
      }
    });

  } catch (error) {
    console.error('Verify property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify property',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// User Management
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { role, status, search } = req.query;

    const filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    // Get additional stats for each agent
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject();

        if (user.role === 'agent') {
          const [landTotal, landVerified, houseTotal, houseVerified, rentalTotal, rentalVerified] = await Promise.all([
            Land.countDocuments({ uploadedBy: user._id }),
            Land.countDocuments({ uploadedBy: user._id, verificationStatus: 'verified' }),
            House.countDocuments({ uploadedBy: user._id }),
            House.countDocuments({ uploadedBy: user._id, verificationStatus: 'verified' }),
            Rental.countDocuments({ uploadedBy: user._id }),
            Rental.countDocuments({ uploadedBy: user._id, verificationStatus: 'verified' })
          ]);

          const propertyCount = landTotal + houseTotal + rentalTotal;
          const verifiedCount = landVerified + houseVerified + rentalVerified;

          userObj.stats = {
            totalProperties: propertyCount,
            verifiedProperties: verifiedCount
          };
        }

        return userObj;
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Block/Unblock User
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role, reason } = req.body;

    // Validate status if provided
    if (status && !['active', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be active or blocked'
      });
    }

    // Validate role if provided
    if (role && !['user', 'agent', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be user, agent, or admin'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin' && (status || role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify admin user status or role'
      });
    }

    const oldStatus = user.status;
    const oldRole = user.role;

    // Update status if provided
    if (status) {
      user.status = status;
    }

    // Update role if provided
    if (role) {
      user.role = role;
    }

    await user.save();

    // Log user status/role change
    let actionType = '';
    let details = '';

    if (status && role) {
      actionType = 'user_update';
      details = `User updated: ${user.name} (${user.email}) - Status: ${oldStatus} → ${status}, Role: ${oldRole} → ${role} - ${reason || 'No reason provided'}`;
    } else if (status) {
      actionType = status === 'blocked' ? 'user_block' : 'user_unblock';
      details = `User ${status}: ${user.name} (${user.email}) - ${reason || 'No reason provided'}`;
    } else if (role) {
      actionType = 'user_role_change';
      details = `User role changed: ${user.name} (${user.email}) - ${oldRole} → ${role} - ${reason || 'No reason provided'}`;
    }

    await Activity.logActivity({
      action: actionType,
      userId: req.user._id,
      targetUserId: user._id,
      category: 'admin',
      severity: status === 'blocked' ? 'high' : 'medium',
      details,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        oldStatus,
        newStatus: status || oldStatus,
        oldRole,
        newRole: role || oldRole,
        reason,
        targetUserRole: user.role
      }
    });

    res.json({
      success: true,
      message: `User ${status} successfully`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }
      }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Activity Monitoring
const getActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const {
      category,
      action,
      severity,
      status,
      userId,
      startDate,
      endDate
    } = req.query;

    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (action) {
      filter.action = action;
    }

    if (severity && severity !== 'all') {
      filter.severity = severity;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (userId) {
      filter.userId = userId;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    const activities = await Activity.getAdminActivities(filter, limit)
      .skip(skip);

    const totalActivities = await Activity.countDocuments(filter);
    const totalPages = Math.ceil(totalActivities / limit);

    // Get activity summary stats
    const activityStats = await Activity.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        activities: activities.map(activity => activity.getFormattedActivity()),
        pagination: {
          currentPage: page,
          totalPages,
          totalActivities,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        stats: activityStats
      }
    });

  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Security Alerts
const getSecurityAlerts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const alerts = await Activity.getSecurityAlerts(limit);

    res.json({
      success: true,
      data: {
        alerts: alerts.map(alert => alert.getFormattedActivity())
      }
    });

  } catch (error) {
    console.error('Get security alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security alerts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// System Analytics
const getAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    let startDate;
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Property verification trends across all models
    const [landVerificationTrends, houseVerificationTrends, rentalVerificationTrends] = await Promise.all([
      Land.aggregate([
        {
          $match: {
            'verificationDetails.verifiedAt': { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$verificationDetails.verifiedAt'
                }
              },
              status: '$verificationStatus'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),
      House.aggregate([
        {
          $match: {
            'verificationDetails.verifiedAt': { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$verificationDetails.verifiedAt'
                }
              },
              status: '$verificationStatus'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),
      Rental.aggregate([
        {
          $match: {
            'verificationDetails.verifiedAt': { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$verificationDetails.verifiedAt'
                }
              },
              status: '$verificationStatus'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ])
    ]);

    // Merge verification trends
    const verificationTrendsMap = new Map();
    [...landVerificationTrends, ...houseVerificationTrends, ...rentalVerificationTrends].forEach(item => {
      const key = `${item._id.date}-${item._id.status}`;
      if (verificationTrendsMap.has(key)) {
        verificationTrendsMap.get(key).count += item.count;
      } else {
        verificationTrendsMap.set(key, { _id: item._id, count: item.count });
      }
    });
    const verificationTrends = Array.from(verificationTrendsMap.values()).sort((a, b) => a._id.date.localeCompare(b._id.date));

    // User activity trends
    const userActivityTrends = await Activity.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            action: '$action'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Top active districts across all models
    const [landDistricts, houseDistricts, rentalDistricts] = await Promise.all([
      Land.aggregate([
        {
          $match: {
            verificationStatus: 'verified',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$location.district',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      House.aggregate([
        {
          $match: {
            verificationStatus: 'verified',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$location.district',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Rental.aggregate([
        {
          $match: {
            verificationStatus: 'verified',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$location.district',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Merge top districts
    const districtsMap = new Map();
    [...landDistricts, ...houseDistricts, ...rentalDistricts].forEach(item => {
      if (districtsMap.has(item._id)) {
        districtsMap.set(item._id, districtsMap.get(item._id) + item.count);
      } else {
        districtsMap.set(item._id, item.count);
      }
    });
    const topDistricts = Array.from(districtsMap.entries())
      .map(([district, count]) => ({ _id: district, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        period,
        verificationTrends,
        userActivityTrends,
        topDistricts
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get verification settings
const getVerificationSettings = async (req, res) => {
  try {
    const verificationMode = await AdminSettings.getVerificationMode();

    res.json({
      success: true,
      data: {
        verificationMode,
        availableModes: ['manual', 'auto'],
        description: {
          manual: 'All properties require manual admin approval',
          auto: 'Properties are automatically verified via survey number API'
        }
      }
    });

  } catch (error) {
    console.error('Get verification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verification settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update verification settings
const updateVerificationSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { verificationMode } = req.body;

    const setting = await AdminSettings.setVerificationMode(verificationMode, req.user._id);

    // Log the settings change
    await Activity.logActivity({
      action: 'admin_settings_update',
      userId: req.user._id,
      category: 'admin',
      severity: 'medium',
      details: `Verification mode changed to: ${verificationMode}`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        settingKey: 'verification_mode',
        newValue: verificationMode,
        previousValue: setting.previousValue || 'manual'
      }
    });

    res.json({
      success: true,
      message: 'Verification settings updated successfully',
      data: {
        verificationMode: setting.settingValue,
        updatedAt: setting.updatedAt
      }
    });

  } catch (error) {
    console.error('Update verification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update verification settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
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
};