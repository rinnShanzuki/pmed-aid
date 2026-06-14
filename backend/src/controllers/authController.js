const jwt = require('jsonwebtoken');
const { User, Patient, QrCode, AuditLog } = require('../models');
const { validationResult } = require('express-validator');

// Cookie options — httpOnly prevents JS access (XSS protection)
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'none',                                    // MUST be 'none' for cross-domain requests (Vercel -> Render)
  secure: true,                                        // MUST be true when sameSite is 'none'
  maxAge: 24 * 60 * 60 * 1000,                        // 24 hours in ms
};

/**
 * Generate and set JWT as httpOnly cookie + return sanitized user.
 */
function issueTokenAndRespond(res, user, statusCode = 200, extra = {}) {
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  res.cookie('token', token, COOKIE_OPTIONS);

  res.status(statusCode).json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
      ...extra,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login  — Staff login (email + password)
// ─────────────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let { email, password } = req.body;
    console.log('[DEBUG LOGIN INPUT]', { rawEmail: email, rawPassword: password });
    email = email?.trim();
    password = password?.trim();

    // Fetch user including password field (normally hidden by toJSON)
    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google Sign-In. Please use the Google button.',
      });
    }

    const isMatch = await user.comparePassword(password);
    console.log('[DEBUG LOGIN RESULT]', { email, userExists: !!user, hasPass: !!user.password, isMatch });
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    issueTokenAndRespond(res, user);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/google  — Google OAuth (patient or staff)
// ─────────────────────────────────────────────────────────────────────────────
exports.googleAuth = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { google_id, email, first_name, last_name } = req.body;

    let user = await User.findOne({ where: { google_id } });

    if (!user) {
      user = await User.findOne({ where: { email } });
      if (user) {
        // Link google_id to existing account
        await user.update({ google_id });
      } else {
        user = await User.create({ email, first_name, last_name, role: 'patient', google_id });
      }
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    issueTokenAndRespond(res, user);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register  — Create staff user (admin only)
// ─────────────────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, first_name, last_name, role } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ email, password, first_name, last_name, role });

    await AuditLog.create({
      user_id: req.user.id,
      action: 'user_registered',
      entity_type: 'user',
      entity_id: user.id,
      details: { role },
      ip_address: req.ip,
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/public-register  — Patient self-registration (public)
// ─────────────────────────────────────────────────────────────────────────────
exports.publicRegister = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, first_name, last_name } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Role is always 'patient' — not user-supplied (security)
    const user = await User.create({ email, password, first_name, last_name, role: 'patient' });

    res.status(201).json({ success: true, data: { user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role } } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/qr-bind  — Patient scans discharge QR and creates/links account
// ─────────────────────────────────────────────────────────────────────────────
exports.qrBind = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { code, email, first_name, last_name, google_id, password } = req.body;

    // Verify QR exists and is not already bound
    const qrCode = await QrCode.findOne({ where: { code }, include: [{ association: 'patient' }] });

    if (!qrCode) {
      return res.status(404).json({ success: false, message: 'QR code not found.' });
    }
    if (!qrCode.is_active) {
      return res.status(400).json({ success: false, message: 'This QR code is no longer active.' });
    }
    if (qrCode.is_bound) {
      return res.status(400).json({
        success: false,
        message: 'This QR code has already been bound to an account. Each QR code can only be used once.',
      });
    }

    // Find or create the patient user account
    let user = null;
    if (google_id) user = await User.findOne({ where: { google_id } });
    if (!user) user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        email,
        password: password || null,
        first_name,
        last_name,
        role: 'patient',
        google_id: google_id || null,
      });
    }

    // One-time bind: lock QR to this account
    await qrCode.update({
      bound_user_id: user.id,
      is_bound: true,
      bound_at: new Date(),
    });

    // Link the patient record to the user account
    await qrCode.patient.update({ user_id: user.id });

    issueTokenAndRespond(res, user, 200, { patient: qrCode.patient });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  — Return current user from cookie
// ─────────────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    let patientProfile = null;
    if (user.role === 'patient') {
      patientProfile = await Patient.findOne({ where: { user_id: user.id } });
    }
    res.json({ success: true, data: { user, patientProfile } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout  — Clear the httpOnly cookie
// ─────────────────────────────────────────────────────────────────────────────
exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  });
  res.json({ success: true, message: 'Logged out successfully.' });
};
