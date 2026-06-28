const { QrCode, MedicationSchedule, Patient, PrescriptionItem, User, Prescription } = require('../models');
const { generateQRDataURL } = require('../utils/qrGenerator');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

exports.generate = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { patient_id, admission_id, prescription_id, type } = req.body;

    const qrCode = await QrCode.create({ patient_id, admission_id, prescription_id: prescription_id || null, type });
    const qr_image = await generateQRDataURL(qrCode.code);

    res.status(201).json({ success: true, data: { ...qrCode.toJSON(), qr_image } });
  } catch (error) { next(error); }
};

exports.scan = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { code } = req.body;

    const qrCode = await QrCode.findOne({
      where: { code },
      include: [{ model: Patient, as: 'patient' }],
    });
    if (!qrCode) return res.status(404).json({ success: false, message: 'QR code not found.' });
    if (qrCode.status !== 'active') return res.status(400).json({ success: false, message: 'QR code is no longer active.' });

    // Get today's pending/upcoming schedules
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const where = {
      patient_id: qrCode.patient_id,
      scheduled_time: { [Op.gte]: today, [Op.lt]: tomorrow },
    };
    if (qrCode.prescription_id) where.prescription_id = qrCode.prescription_id;

    const schedules = await MedicationSchedule.findAll({
      where,
      include: [{ model: PrescriptionItem, as: 'prescriptionItem' }],
      order: [['scheduled_time', 'ASC']],
    });

    res.json({ success: true, data: { patient: qrCode.patient, qr_code: qrCode, schedules } });
  } catch (error) { next(error); }
};

exports.verify = async (req, res, next) => {
  try {
    const { code } = req.body;
    const qrCode = await QrCode.findOne({
      where: { code },
      include: [{ model: Patient, as: 'patient', attributes: ['first_name', 'last_name', 'email'] }],
    });
    if (!qrCode) return res.status(404).json({ success: false, message: 'QR code not found.' });

    res.json({
      success: true,
      data: {
        code: qrCode.code,
        type: qrCode.type,
        patient_id: qrCode.patient_id,
        admission_id: qrCode.admission_id,
        is_bound: qrCode.status === 'bound',
        is_active: qrCode.status === 'active',
        patient_name: `${qrCode.patient.first_name} ${qrCode.patient.last_name}`,
        patient: {
          first_name: qrCode.patient.first_name,
          last_name: qrCode.patient.last_name,
          email: qrCode.patient.email || null,
        },
      },
    });
  } catch (error) { next(error); }
};

exports.getByPatient = async (req, res, next) => {
  try {
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ where: { user_id: req.user.id } });
      if (!patient || String(patient.id) !== String(req.params.patientId)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const qrCodes = await QrCode.findAll({
      where: { patient_id: req.params.patientId },
      include: [
        { model: User, as: 'boundUser', attributes: ['id', 'email'] },
        { model: Prescription, as: 'prescription', attributes: ['id', 'type', 'status'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const codesWithImages = await Promise.all(
      qrCodes.map(async qr => ({
        ...qr.toJSON(),
        qr_image: await generateQRDataURL(qr.code),
      }))
    );

    res.json({ success: true, data: codesWithImages });
  } catch (error) { next(error); }
};
