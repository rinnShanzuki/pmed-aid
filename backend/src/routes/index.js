const express = require('express');
const router = express.Router();

// Controllers
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const patientController = require('../controllers/patientController');
const roomController = require('../controllers/roomController');
const admissionController = require('../controllers/admissionController');
const prescriptionController = require('../controllers/prescriptionController');
const scheduleController = require('../controllers/scheduleController');
const qrCodeController = require('../controllers/qrCodeController');
const dashboardController = require('../controllers/dashboardController');
const notificationController = require('../controllers/notificationController');
const analyticsController = require('../controllers/analyticsController');
const adminController = require('../controllers/adminController');
const medicationController = require('../controllers/medicationController');
const billingController = require('../controllers/billingController');
const infoDeskController = require('../controllers/infoDeskController');
const qrController = require('../controllers/qrController');

// Middleware & Validators
const auth = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');
const {
  registerValidator, publicRegisterValidator, loginValidator, googleAuthValidator, qrBindValidator,
  patientValidator, roomValidator, admissionValidator,
  prescriptionValidator, prescriptionItemValidator,
  qrGenerateValidator, qrScanValidator,
  idParam, patientIdParam,
} = require('../utils/validators');

// ============================================================
// Welcome
// ============================================================
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the PMED-AID API', version: '1.0.0' });
});

// ============================================================
// AUTH  —  /api/auth
// ============================================================
router.post('/auth/login',    loginValidator,      authController.login);
router.post('/auth/google',   googleAuthValidator, authController.googleAuth);
router.post('/auth/qr-bind',  qrBindValidator,     authController.qrBind);
router.post('/auth/register', auth, roleGuard(['admin']), registerValidator, authController.register);
router.post('/auth/public-register', publicRegisterValidator, authController.publicRegister);
router.get ('/auth/me',       auth, authController.getMe);
router.post('/auth/logout',   auth, authController.logout);

// ============================================================
// USERS  —  /api/users  (admin only)
// ============================================================
router.post  ('/users',     auth, roleGuard(['admin']), userController.createUser);
router.get   ('/users',     auth, roleGuard(['admin', 'info_desk']), userController.getAll);
router.get   ('/users/:id', auth, roleGuard(['admin']), idParam, userController.getById);
router.put   ('/users/:id', auth, roleGuard(['admin']), idParam, userController.update);
router.delete('/users/:id', auth, roleGuard(['admin']), idParam, userController.delete);

// ============================================================
// ADMIN  —  /api/admin  (admin only)
// ============================================================
router.get('/admin/dashboard', auth, roleGuard(['admin']), adminController.getDashboardStats);
router.get('/admin/settings',  auth, roleGuard(['admin']), adminController.getSettings);
router.put('/admin/settings',  auth, roleGuard(['admin']), adminController.updateSettings);

// ============================================================
// MEDICATIONS  —  /api/medications
// ============================================================
router.get   ('/medications',     auth, medicationController.getAll);
router.get   ('/medications/:id', auth, idParam, medicationController.getById);
router.post  ('/medications',     auth, roleGuard(['admin', 'info_desk', 'doctor']), medicationController.create);
router.put   ('/medications/:id', auth, roleGuard(['admin', 'info_desk', 'doctor']), idParam, medicationController.update);
router.delete('/medications/:id', auth, roleGuard(['admin']), idParam, medicationController.delete);

// ============================================================
// BILLING  —  /api/billing  (admin & info_desk)
// ============================================================
router.get  ('/billing',            auth, roleGuard(['admin', 'info_desk']), billingController.getAll);
router.post ('/billing/generate',   auth, roleGuard(['admin', 'info_desk']), billingController.generateBill);
router.get  ('/billing/:id',        auth, roleGuard(['admin', 'info_desk']), idParam, billingController.getById);
router.patch('/billing/:id/status', auth, roleGuard(['admin', 'info_desk']), idParam, billingController.updateStatus);

// ============================================================
// INFO DESK  —  /api/info-desk
// ============================================================
router.get('/info-desk/dashboard', auth, roleGuard(['info_desk', 'admin']), infoDeskController.getDashboardStats);
router.get('/info-desk/pending-discharges', auth, roleGuard(['info_desk', 'admin']), infoDeskController.getPendingDischarges);
router.post('/info-desk/discharges/:id/confirm', auth, roleGuard(['info_desk', 'admin']), idParam, infoDeskController.confirmDischarge);
router.get('/info-desk/patients/:patientId/discharge-qr', auth, roleGuard(['info_desk', 'admin']), patientIdParam, infoDeskController.getDischargeQrCodes);
router.get('/info-desk/patients/:patientId/discharge-prescriptions', auth, roleGuard(['info_desk', 'admin']), patientIdParam, infoDeskController.getDischargePrescriptions);
router.get('/info-desk/qr-codes',  auth, roleGuard(['info_desk', 'admin']), qrController.getAll);

// ============================================================
// PATIENTS  —  /api/patients
// ============================================================
router.post('/patients',     auth, roleGuard(['info_desk', 'admin']),                          patientValidator, patientController.create);
router.get ('/patients',     auth, roleGuard(['info_desk', 'doctor', 'nurse', 'admin']),        patientController.getAll);
router.get ('/patients/me',  auth, roleGuard(['patient']),                                      patientController.getMe);
router.get ('/patients/:id', auth, roleGuard(['info_desk', 'doctor', 'nurse', 'admin']), idParam, patientController.getById);
router.put ('/patients/:id', auth, roleGuard(['info_desk', 'doctor', 'admin']),          idParam, patientController.update);

// ============================================================
// ROOMS  —  /api/rooms
// ============================================================
router.post('/rooms',           auth, roleGuard(['admin', 'info_desk']),                          roomValidator, roomController.create);
router.get ('/rooms',           auth, roleGuard(['admin', 'info_desk', 'doctor', 'nurse']),        roomController.getAll);
router.get ('/rooms/available', auth, roleGuard(['info_desk', 'admin']),                           roomController.getAvailable);
router.get ('/rooms/:id',       auth, roleGuard(['admin', 'info_desk', 'doctor', 'nurse']), idParam, roomController.getById);
router.put ('/rooms/:id',       auth, roleGuard(['admin', 'info_desk']),                    idParam, roomController.update);

// ============================================================
// ADMISSIONS  —  /api/admissions
// ============================================================
router.post('/admissions',              auth, roleGuard(['info_desk', 'admin']),                        admissionValidator, admissionController.create);
router.get ('/admissions',              auth, roleGuard(['info_desk', 'doctor', 'nurse', 'admin']),      admissionController.getAll);
router.get ('/admissions/:id',          auth, roleGuard(['info_desk', 'doctor', 'nurse', 'admin']), idParam, admissionController.getById);
router.put ('/admissions/:id',          auth, roleGuard(['info_desk', 'doctor', 'admin']),          idParam, admissionController.update);
router.post('/admissions/:id/request-discharge', auth, roleGuard(['doctor', 'admin']),              idParam, admissionController.requestDischarge);
router.post('/admissions/:id/handover',          auth, roleGuard(['doctor', 'admin']),              idParam, admissionController.handoverPrescription);
router.post('/admissions/:id/discharge',auth, roleGuard(['info_desk', 'doctor', 'admin']),          idParam, admissionController.discharge);

// ============================================================
// PRESCRIPTIONS  —  /api/prescriptions
// ============================================================
router.post('/prescriptions',              auth, roleGuard(['doctor', 'info_desk', 'admin']),                       prescriptionValidator, prescriptionController.create);
router.get ('/prescriptions',              auth, roleGuard(['doctor', 'nurse', 'info_desk', 'patient', 'admin']),    prescriptionController.getAll);
router.get ('/prescriptions/:id',          auth, roleGuard(['doctor', 'nurse', 'info_desk', 'patient', 'admin']), idParam, prescriptionController.getById);
router.put ('/prescriptions/:id',          auth, roleGuard(['doctor', 'info_desk', 'admin']),                     idParam, prescriptionController.update);
router.post('/prescriptions/:id/items',    auth, roleGuard(['doctor', 'info_desk', 'admin']),                     idParam, prescriptionController.addItems);
router.put ('/prescriptions/items/:id',    auth, roleGuard(['doctor', 'info_desk', 'admin']),                     idParam, prescriptionController.updateItem);

// ============================================================
// MEDICATION SCHEDULES  —  /api/schedules
// ============================================================
router.get ('/schedules',                        auth, roleGuard(['doctor', 'nurse', 'admin']),                    scheduleController.getAll);
router.get ('/schedules/patient/:patientId',     auth, roleGuard(['doctor', 'nurse', 'patient', 'admin']), patientIdParam, scheduleController.getByPatient);
router.get ('/schedules/:id',                    auth, roleGuard(['doctor', 'nurse', 'admin']),             idParam,        scheduleController.getById);
router.post('/schedules/:id/administer',         auth, roleGuard(['nurse', 'admin']),                      idParam,        scheduleController.administer);
router.post('/schedules/:id/confirm',            auth, roleGuard(['patient']),                              idParam,        scheduleController.confirm);
router.post('/schedules/:id/unconfirm',          auth, roleGuard(['patient']),                              idParam,        scheduleController.unconfirm);
router.put ('/schedules/:id/skip',               auth, roleGuard(['doctor', 'nurse', 'admin']),             idParam,        scheduleController.skip);

// ============================================================
// QR CODES  —  /api/qr-codes
// ============================================================
router.post('/qr-codes/verify',               qrScanValidator,  qrCodeController.verify);  // Public
router.post('/qr-codes/generate',   auth, roleGuard(['info_desk', 'doctor', 'admin']),  qrGenerateValidator, qrCodeController.generate);
router.post('/qr-codes/scan',        auth, roleGuard(['nurse', 'doctor', 'admin']),      qrScanValidator,     qrCodeController.scan);
router.get ('/qr-codes/patient/:patientId', auth, roleGuard(['info_desk', 'doctor', 'patient', 'admin']), patientIdParam, qrCodeController.getByPatient);

// ============================================================
// DASHBOARD  —  /api/dashboard
// ============================================================
router.get('/dashboard/overview',            auth, roleGuard(['admin', 'info_desk', 'doctor', 'nurse']),   dashboardController.overview);
router.get('/dashboard/medication-status',   auth, roleGuard(['doctor', 'nurse', 'info_desk', 'admin']),                dashboardController.medicationStatus);
router.get('/dashboard/alerts',              auth, roleGuard(['doctor', 'nurse', 'info_desk', 'admin']),                dashboardController.alerts);
router.get('/dashboard/patient/:patientId',  auth, roleGuard(['doctor', 'nurse', 'info_desk', 'admin']), patientIdParam, dashboardController.patientTimeline);

// ============================================================
// NOTIFICATIONS  —  /api/notifications
// ============================================================
router.get('/notifications',          auth, notificationController.getAll);
router.put('/notifications/read-all', auth, notificationController.markAllRead);
router.put('/notifications/:id/read', auth, idParam, notificationController.markRead);

// ============================================================
// ANALYTICS  —  /api/analytics
// ============================================================
router.get('/analytics/adherence',         auth, roleGuard(['admin', 'doctor']), analyticsController.adherence);
router.get('/analytics/medication-trends', auth, roleGuard(['admin', 'doctor']), analyticsController.medicationTrends);
router.get('/analytics/staff-performance', auth, roleGuard(['admin']),           analyticsController.staffPerformance);

module.exports = router;
