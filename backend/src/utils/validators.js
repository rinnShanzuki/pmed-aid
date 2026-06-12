const { body, param, query } = require('express-validator');

// ==========================================
// Auth Validators
// ==========================================
const registerValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').notEmpty().trim().withMessage('First name is required'),
  body('last_name').notEmpty().trim().withMessage('Last name is required'),
  body('role').isIn(['admin', 'info_desk', 'doctor', 'nurse']).withMessage('Valid role is required'),
];

const publicRegisterValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').notEmpty().trim().withMessage('First name is required'),
  body('last_name').notEmpty().trim().withMessage('Last name is required'),
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const googleAuthValidator = [
  body('google_id').notEmpty().withMessage('Google ID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('first_name').notEmpty().trim().withMessage('First name is required'),
  body('last_name').notEmpty().trim().withMessage('Last name is required'),
];

const qrBindValidator = [
  body('code').notEmpty().withMessage('QR code is required'),
  body('google_id').optional().isString(),
  body('email').isEmail().withMessage('Valid email is required'),
  body('first_name').notEmpty().trim().withMessage('First name is required'),
  body('last_name').notEmpty().trim().withMessage('Last name is required'),
];

// ==========================================
// Patient Validators
// ==========================================
const patientValidator = [
  body('first_name').notEmpty().trim().withMessage('First name is required'),
  body('last_name').notEmpty().trim().withMessage('Last name is required'),
  body('date_of_birth').isDate().withMessage('Valid date of birth is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  body('contact_number').notEmpty().withMessage('Contact number is required'),
];

// ==========================================
// Room Validators
// ==========================================
const roomValidator = [
  body('room_number').notEmpty().trim().withMessage('Room number is required'),
  body('room_type').optional().isIn(['ward', 'semi_private', 'private', 'icu']).withMessage('Valid room type is required'),
];

// ==========================================
// Admission Validators
// ==========================================
const admissionValidator = [
  body('patient_id').isInt().withMessage('Valid patient ID is required'),
  body('room_id').isInt().withMessage('Valid room ID is required'),
  body('attending_doctor_id').isInt().withMessage('Valid doctor ID is required'),
];

// ==========================================
// Prescription Validators
// ==========================================
const prescriptionValidator = [
  body('admission_id').isInt().withMessage('Valid admission ID is required'),
  body('patient_id').isInt().withMessage('Valid patient ID is required'),
  body('type').optional().isIn(['in_hospital', 'discharge']).withMessage('Valid type is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one medication item is required'),
  body('items.*.medication_name').notEmpty().withMessage('Medication name is required'),
  body('items.*.dosage').notEmpty().withMessage('Dosage is required'),
  body('items.*.frequency').isInt({ min: 1 }).withMessage('Frequency must be at least 1'),
  body('items.*.duration').isInt({ min: 1 }).withMessage('Duration must be at least 1'),
];

const prescriptionItemValidator = [
  body('medication_name').notEmpty().withMessage('Medication name is required'),
  body('dosage').notEmpty().withMessage('Dosage is required'),
  body('frequency').isInt({ min: 1 }).withMessage('Frequency must be at least 1'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1'),
];

// ==========================================
// QR Code Validators
// ==========================================
const qrGenerateValidator = [
  body('patient_id').isInt().withMessage('Valid patient ID is required'),
  body('admission_id').isInt().withMessage('Valid admission ID is required'),
  body('prescription_id').optional({ nullable: true, checkFalsy: true }).isInt().withMessage('Valid prescription ID is required'),
  body('type').isIn(['in_hospital', 'discharge']).withMessage('Valid QR type is required'),
];

const qrScanValidator = [
  body('code').notEmpty().withMessage('QR code is required'),
];

// ==========================================
// Param Validators
// ==========================================
const idParam = [
  param('id').isInt().withMessage('Valid ID is required'),
];

const patientIdParam = [
  param('patientId').isInt().withMessage('Valid patient ID is required'),
];

module.exports = {
  registerValidator,
  publicRegisterValidator,
  loginValidator,
  googleAuthValidator,
  qrBindValidator,
  patientValidator,
  roomValidator,
  admissionValidator,
  prescriptionValidator,
  prescriptionItemValidator,
  qrGenerateValidator,
  qrScanValidator,
  idParam,
  patientIdParam,
};
