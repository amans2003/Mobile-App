/**
 * Admin-only middleware
 * Must be used AFTER the protect middleware
 * Checks if the authenticated user has admin role
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

module.exports = { adminOnly };
