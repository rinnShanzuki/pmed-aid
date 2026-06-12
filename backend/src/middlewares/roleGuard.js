/**
 * Role-based access control middleware.
 * Accepts an array of allowed roles and checks if req.user.role is included.
 * Must be used AFTER the auth middleware.
 *
 * Usage: router.get('/admin-only', auth, roleGuard(['admin']), handler)
 */
const roleGuard = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = roleGuard;
