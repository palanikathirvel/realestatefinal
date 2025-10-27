const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Handle admin token specially
    if (decoded.id === 'admin' && decoded.role === 'admin') {
      req.user = {
        _id: 'admin',
        id: 'admin',
        role: 'admin',
        email: decoded.email,
        name: 'Administrator',
        status: 'active'
      };

      // Log admin activity (non-blocking)
      setImmediate(async () => {
        try {
          await Activity.logActivity({
            action: 'admin_api_access',
            category: 'admin',
            details: `Admin accessed ${req.method} ${req.originalUrl}`,
            metadata: {
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              adminEmail: decoded.email
            }
          });
        } catch (error) {
          console.error('Error logging admin activity:', error);
        }
      });

      return next();
    }

    // Handle regular user tokens
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Account has been blocked. Contact administrator.'
      });
    }

    // Add user to request object
    req.user = user;

    // Log user activity (non-blocking)
    setImmediate(async () => {
      try {
        await Activity.logActivity({
          action: 'api_access',
          userId: user._id,
          category: 'auth',
          details: `Accessed ${req.method} ${req.originalUrl}`,
          metadata: {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        });
      } catch (error) {
        console.error('Error logging activity:', error);
      }
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};