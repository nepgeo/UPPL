// /backend/middleware/roleMiddleware.js
// middleware/roleMiddleware.js
exports.isAdmin = (req, res, next) => {
  if (req.user && ['admin', 'super-admin'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admins or Super Admins only' });
  }
};

exports.isPlayer = (req, res, next) => {
  if (req.user.role !== 'player') {
    return res.status(403).json({ message: 'Access denied. Players only.' });
  }
  next();
};

exports.isUser = (req, res, next) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'Access denied. Users only.' });
  }
  next();
};