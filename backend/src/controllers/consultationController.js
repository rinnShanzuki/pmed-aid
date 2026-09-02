const { Consultation, Patient, User, QrCode, AuditLog, Prescription } = require('../models');
const { validationResult } = require('express-validator');
const { notifyInfoDesk } = require('../utils/notificationHelper');

exports.create = async (req, res, next) => {
  try {
    const { patient_id, doctor_id, notes, department, chief_complaint, hpi, symptoms, findings, vital_signs, assessment, follow_up_date } = req.body;

    const consultation = await Consultation.create({
      patient_id,
      doctor_id,
      notes,
      department,
      chief_complaint,
      hpi,
      symptoms,
      findings,
      vital_signs,
      assessment,
      follow_up_date
    });

    await AuditLog.create({
      user_id: req.user.id,
      action: 'consultation_created',
      entity_type: 'consultation',
      entity_id: consultation.id,
      details: { patient_id, doctor_id },
      ip_address: req.ip,
    });

    const full = await Consultation.findByPk(consultation.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'doctor', attributes: ['id', 'first_name', 'last_name'] },
      ],
    });
    res.status(201).json({ success: true, data: full });
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) {
      const statuses = req.query.status.split(',');
      where.status = statuses;
    }
    if (req.query.doctor_id) where.doctor_id = req.query.doctor_id;
    if (req.query.patient_id) where.patient_id = req.query.patient_id;
    if (req.query.admission_required !== undefined) {
      where.admission_required = req.query.admission_required === 'true';
    }
    // Only fetch consultations without an admission if specified
    if (req.query.pending_admission === 'true') {
      where.admission_id = null;
    }

    if (req.user && req.user.role === 'doctor') where.doctor_id = req.user.id;

    const consultations = await Consultation.findAll({
      where,
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'doctor', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['created_at', 'ASC']],
    });
    res.json({ success: true, data: consultations });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'doctor', attributes: ['id', 'first_name', 'last_name'] },
      ],
    });
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found.' });
    res.json({ success: true, data: consultation });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id);
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found.' });

    await consultation.update(req.body);
    res.json({ success: true, data: consultation });
  } catch (error) { next(error); }
};

exports.requestAdmission = async (req, res, next) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id, {
      include: [{ model: Patient, as: 'patient' }],
    });
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found.' });

    await consultation.update({
      admission_required: true,
      diagnosis: req.body.diagnosis || consultation.diagnosis,
      doctor_notes: req.body.doctor_notes || consultation.doctor_notes,
      status: 'completed',
    });

    await notifyInfoDesk({
      type: 'alert',
      title: 'Admission Required',
      message: `Dr. requested admission for ${consultation.patient?.first_name || 'a patient'} ${consultation.patient?.last_name || ''}. Please assign a room.`,
      priority: 'high',
      related_consultation_id: consultation.id,
    });

    await AuditLog.create({
      user_id: req.user.id,
      action: 'admission_requested',
      entity_type: 'consultation',
      entity_id: consultation.id,
      details: { patient_id: consultation.patient_id },
      ip_address: req.ip,
    });

    res.json({ success: true, message: 'Admission requested successfully.', data: consultation });
  } catch (error) { next(error); }
};

exports.completeOutpatient = async (req, res, next) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id, {
      include: [{ model: Patient, as: 'patient' }],
    });
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found.' });

    await consultation.update({
      admission_required: false,
      diagnosis: req.body.diagnosis || consultation.diagnosis,
      doctor_notes: req.body.doctor_notes || consultation.doctor_notes,
      status: 'completed',
    });

    // Check if there's a prescription for this consultation
    const prescription = await Prescription.findOne({
      where: { consultation_id: consultation.id, type: 'outpatient' },
      order: [['created_at', 'DESC']],
    });

    // Generate outpatient QR code if it doesn't exist
    let qrCode = await QrCode.findOne({ where: { consultation_id: consultation.id, type: 'outpatient' } });
    if (!qrCode) {
      qrCode = await QrCode.create({
        patient_id: consultation.patient_id,
        admission_id: null,
        consultation_id: consultation.id,
        prescription_id: prescription?.id || null,
        type: 'outpatient',
      });
    } else if (prescription && qrCode.prescription_id !== prescription.id) {
      await qrCode.update({ prescription_id: prescription.id });
    }

    await notifyInfoDesk({
      type: 'alert',
      title: 'Outpatient Consultation Completed',
      message: `Consultation completed for ${consultation.patient?.first_name || 'a patient'} ${consultation.patient?.last_name || ''}. Please print prescription and QR code.`,
      priority: 'medium',
      related_consultation_id: consultation.id,
    });

    await AuditLog.create({
      user_id: req.user.id,
      action: 'outpatient_consultation_completed',
      entity_type: 'consultation',
      entity_id: consultation.id,
      details: { patient_id: consultation.patient_id },
      ip_address: req.ip,
    });

    res.json({ success: true, message: 'Outpatient consultation completed.', data: consultation });
  } catch (error) { next(error); }
};
