const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const auth = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');
const { body } = require('express-validator');

// Create consultation (Info desk & Doctor ad-hoc)
router.post(
  '/',
  auth,
  roleGuard(['admin', 'info_desk', 'doctor']),
  [
    body('patient_id').isInt().withMessage('Patient ID is required'),
    body('doctor_id').isInt().withMessage('Doctor ID is required'),
  ],
  consultationController.create
);

// Get all consultations
router.get('/', auth, consultationController.getAll);

// Get consultation by ID
router.get('/:id', auth, consultationController.getById);

// Update consultation details
router.put('/:id', auth, consultationController.update);

// Doctor requests admission
router.post('/:id/request-admission', auth, roleGuard(['admin', 'doctor']), consultationController.requestAdmission);

// Doctor completes outpatient consultation
router.post('/:id/complete-outpatient', auth, roleGuard(['admin', 'doctor']), consultationController.completeOutpatient);

// Doctor hands over consultation prescription to info desk
router.post('/:id/handover', auth, roleGuard(['admin', 'doctor']), consultationController.handoverPrescription);

module.exports = router;
