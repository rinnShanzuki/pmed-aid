const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * JWT authentication middleware.
 * Reads token from httpOnly cookie first (web), falls back to
 * Authorization header (for mobile app / React Native).
 */
const auth = async (req, res, next) => {
  try {
    // 1. Try httpOnly cookie (web frontend)
    let token = req.cookies?.token;

    // 2. Fallback: Authorization header (mobile / API clients)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please log in.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      where: { id: decoded.userId },
      attributes: ['id', 'email', 'first_name', 'last_name', 'role', 'is_active'],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    next(error);
  }
};

module.exports = auth;
