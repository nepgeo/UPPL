const User = require('../models/User');

const jwt = require('jsonwebtoken');


// Role constants
const ROLES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super-admin',
  PLAYER: 'player',
  USER: 'user',
};

/**
 * Middleware to protect routes by verifying JWT.
 * Adds `req.user = { id, role }` if valid.
 */
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Middleware to restrict access to Admin or SuperAdmin only.
 */
const requireAdminOrSuperAdmin = (req, res, next) => {
  if (req.user && [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(req.user.role)) {
    return next();
  } else {
    return res.status(403).json({ message: 'Access denied: Admin or SuperAdmin only' });
  }
};

/**
 * Middleware for requiring specific roles (single or multiple).
 * Example: requireRole('admin') or requireRole(['admin', 'super-admin'])
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user?.role || ![].concat(allowedRoles).includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient role' });
    }
    next();
  };
};

module.exports = {
  protect,
  requireAdminOrSuperAdmin,
  requireRole,
};
