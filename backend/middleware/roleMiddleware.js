const Activity = require('../models/Activity');
const Land = require('../models/Land');
const House = require('../models/House');
const Rental = require('../models/Rental');

// Role-based access control middleware
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      // Convert string to array if single role passed
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(req.user.role)) {
        // Log unauthorized access attempt
        await Activity.logActivity({
          action: 'unauthorized_access',
          userId: req.user._id,
          category: 'security',
          severity: 'high',
          status: 'failed',
          details: `Attempted to access ${req.method} ${req.originalUrl} with role ${req.user.role}, required: ${allowedRoles.join(', ')}`,
          metadata: {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            requiredRoles: allowedRoles,
            userRole: req.user.role
          }
        });

        return res.status(403).json({ 
          success: false, 
          message: `Access denied. Required role(s): ${allowedRoles.join(', ')}` 
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Authorization error' 
      });
    }
  };
};

// Admin only access
const requireAdmin = requireRole('admin');

// Agent and Admin access
const requireAgentOrAdmin = requireRole(['agent', 'admin']);

// User, Agent and Admin access (authenticated users)
const requireAuth = requireRole(['user', 'agent', 'admin']);

const requireOwnerOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // For property operations, check ownership
    const propertyId = req.params.id || req.body.propertyId;
    if (propertyId) {
      // Search across all property models
      let property = null;
      const models = [Land, House, Rental];
      for (const Model of models) {
        property = await Model.findById(propertyId);
        if (property) break;
      }
      
      if (!property) {
        return res.status(404).json({ 
          success: false, 
          message: 'Property not found' 
        });
      }

      if (property.uploadedBy.toString() !== req.user._id.toString()) {
        await Activity.logActivity({
          action: 'unauthorized_property_access',
          userId: req.user._id,
          propertyId: propertyId,
          category: 'security',
          severity: 'medium',
          status: 'failed',
          details: `Attempted to access property ${propertyId} owned by different user`,
          metadata: {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        });

        return res.status(403).json({ 
          success: false, 
          message: 'You can only access your own properties' 
        });
      }
    }

    next();
  } catch (error) {
    console.error('Owner middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authorization error' 
    });
  }
};

module.exports = {
  requireRole,
  requireAdmin,
  requireAgentOrAdmin,
  requireAuth,
  requireOwnerOrAdmin
};