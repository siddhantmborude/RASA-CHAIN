const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * Protect routes - Verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired, please login again' });
    }
    return res.status(401).json({ error: 'Not authorized, invalid token' });
  }
};

/**
 * Authorize roles
 * Usage: authorize('admin', 'manufacturer')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Role '${req.user.role}' is not authorized to access this resource`,
        requiredRoles: roles,
      });
    }
    next();
  };
};

/**
 * Optional auth - attach user if token present but don't block
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (e) {
    // Silent fail - no token or invalid token
  }
  next();
};

/**
 * Audit logger middleware
 */
const auditLog = (action, category, severity = 'low') => {
  return async (req, res, next) => {
    const originalSend = res.json.bind(res);
    res.json = async (data) => {
      try {
        await AuditLog.create({
          action,
          category,
          severity,
          userId: req.user?._id,
          userName: req.user?.name,
          userRole: req.user?.role,
          resourceId: req.params.id || req.body?.batchId,
          resourceType: category,
          details: {
            method: req.method,
            path: req.path,
            params: req.params,
            statusCode: res.statusCode,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          status: res.statusCode < 400 ? 'success' : 'failure',
          timestamp: new Date(),
        });
      } catch (e) {
        // Don't block response on audit failure
      }
      return originalSend(data);
    };
    next();
  };
};

module.exports = { protect, authorize, optionalAuth, auditLog };
