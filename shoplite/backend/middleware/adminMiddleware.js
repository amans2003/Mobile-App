/**
 * RBAC Middleware — Enterprise HRIS
 * Restricted strictly to two management roles: Super Admin and HR Manager.
 * Must be used AFTER the protect (auth) middleware.
 */

/**
 * Restrict access to specific roles
 * @param  {...string} allowedRoles - Roles permitted to access the route
 */
const authorise = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Restricted to: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

/**
 * Admin-only shorthand
 */
const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'super_admin' || req.user.role === 'hr_manager')) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Super Admin / HR only.' });
  }
};

/**
 * HR & Admin Management access (super_admin, hr_manager)
 */
const hrOnly = authorise('super_admin', 'hr_manager');

/**
 * Finance access mapped strictly to Super Admin & HR Manager
 */
const financeOnly = authorise('super_admin', 'hr_manager');

/**
 * Manager access mapped strictly to Super Admin & HR Manager
 */
const managerOnly = authorise('super_admin', 'hr_manager');

module.exports = { authorise, adminOnly, hrOnly, financeOnly, managerOnly };
