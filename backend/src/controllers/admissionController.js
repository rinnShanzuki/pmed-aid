const { Admission, Patient, Room, User, QrCode, AuditLog, Prescription } = require('../models');
const { validationResult } = require('express-validator');
const { notifyInfoDesk } = require('../utils/notificationHelper');

exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { patient_id, room_id, attending_doctor_id, notes } = req.body;

    const room = await Room.findByPk(room_id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
    if (room.is_occupied) return res.status(409).json({ success: false, message: 'Room is already occupied.' });

    await room.update({ is_occupied: true });

    const admission = await Admission.create({
      patient_id,
      room_id,
      admitted_by: req.user.id,
      attending_doctor_id,
      admission_date: new Date(),
      notes,
    });

    // Auto-generate in-hospital QR code
    await QrCode.create({ patient_id, admission_id: admission.id, type: 'in_hospital' });

    await AuditLog.create({
      user_id: req.user.id,
      action: 'patient_admitted',
      entity_type: 'admission',
      entity_id: admission.id,
      details: { patient_id, room_id },
      ip_address: req.ip,
    });

    const full = await Admission.findByPk(admission.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Room, as: 'room' },
        { model: User, as: 'doctor', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'dischargeRequestedBy', attributes: ['id', 'first_name', 'last_name'] },
      ],
    });
    res.status(201).json({ success: true, data: full });
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) {
      if (req.query.status === 'awaiting_discharge') {
        where.status = 'admitted';
        where.discharge_requested = true;
      } else if (req.query.status === 'admitted') {
        where.status = 'admitted';
        where.discharge_requested = false;
      } else {
        where.status = req.query.status;
      }
    }
    if (req.query.attending_doctor_id) where.attending_doctor_id = req.query.attending_doctor_id;
    if (req.query.assigned_nurse_id) where.assigned_nurse_id = req.query.assigned_nurse_id;
    if (req.user && req.user.role === 'nurse') where.assigned_nurse_id = req.user.id;

    const admissions = await Admission.findAll({
      where,
      include: [
        { model: Patient, as: 'patient' },
        { model: Room, as: 'room' },
        { model: User, as: 'doctor', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'assignedNurse', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'admittedBy', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'dischargeRequestedBy', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['admission_date', 'DESC']],
    });
    res.json({ success: true, data: admissions });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const admission = await Admission.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Room, as: 'room' },
        { model: User, as: 'doctor', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'assignedNurse', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'admittedBy', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'dischargeRequestedBy', attributes: ['id', 'first_name', 'last_name'] },
      ],
    });
    if (!admission) return res.status(404).json({ success: false, message: 'Admission not found.' });
    res.json({ success: true, data: admission });
  } catch (error) { next(error); }
};

exports.requestDischarge = async (req, res, next) => {
  try {
    const admission = await Admission.findByPk(req.params.id, {
      include: [{ model: Patient, as: 'patient' }],
    });
    if (!admission) return res.status(404).json({ success: false, message: 'Admission not found.' });
    if (admission.status === 'discharged') return res.status(400).json({ success: false, message: 'Patient already discharged.' });

    await admission.update({
      discharge_requested: true,
      discharge_requested_by: req.user.id,
      discharge_requested_at: new Date(),
      discharge_notes: req.body.notes || admission.discharge_notes,
      consultation_status: 'completed',
    });

    await notifyInfoDesk({
      type: 'alert',
      title: 'Discharge requested',
      message: `${admission.patient?.first_name || 'A patient'} ${admission.patient?.last_name || ''} is ready for info desk discharge processing.`,
      priority: 'high',
      related_admission_id: admission.id,
    });

    await AuditLog.create({
      user_id: req.user.id,
      action: 'discharge_requested',
      entity_type: 'admission',
      entity_id: admission.id,
      details: { patient_id: admission.patient_id },
      ip_address: req.ip,
    });

    res.json({ success: true, message: 'Discharge request sent to information desk.', data: admission });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const admission = await Admission.findByPk(req.params.id);
    if (!admission) return res.status(404).json({ success: false, message: 'Admission not found.' });

    await admission.update(req.body);
    res.json({ success: true, data: admission });
  } catch (error) { next(error); }
};

exports.discharge = async (req, res, next) => {
  try {
    const admission = await Admission.findByPk(req.params.id);
    if (!admission) return res.status(404).json({ success: false, message: 'Admission not found.' });
    if (admission.status === 'discharged') return res.status(400).json({ success: false, message: 'Patient already discharged.' });

    await admission.update({ status: 'discharged', discharge_date: new Date() });

    // Free the room
    await Room.update({ is_occupied: false }, { where: { id: admission.room_id } });

    const dischargePrescription = await Prescription.findOne({
      where: {
        admission_id: admission.id,
        patient_id: admission.patient_id,
        type: 'discharge',
      },
      order: [['created_at', 'DESC']],
    });

    // Generate discharge QR code for patient portal binding.
    const qrCode = await QrCode.create({
      patient_id: admission.patient_id,
      admission_id: admission.id,
      prescription_id: dischargePrescription?.id || null,
      type: 'discharge',
    });

    await AuditLog.create({
      user_id: req.user.id,
      action: 'patient_discharged',
      entity_type: 'admission',
      entity_id: admission.id,
      details: { patient_id: admission.patient_id },
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: 'Patient discharged.',
      data: { admission, discharge_qr_code: qrCode.code },
    });
  } catch (error) { next(error); }
};

exports.handoverPrescription = async (req, res, next) => {
  try {
    const admission = await Admission.findByPk(req.params.id, {
      include: [{ model: Patient, as: 'patient' }],
    });
    if (!admission) return res.status(404).json({ success: false, message: 'Admission not found.' });

    // Update admission to save diagnosis, notes, and set consultation_status to completed
    await admission.update({
      diagnosis: req.body.diagnosis || admission.diagnosis,
      consultation_notes: req.body.notes || admission.consultation_notes,
      consultation_status: 'completed',
    });

    // Create a pending_encoding prescription
    const prescription = await Prescription.create({
      admission_id: admission.id,
      patient_id: admission.patient_id,
      doctor_id: req.user.id,
      type: 'in_hospital',
      status: 'pending_encoding',
      notes: req.body.notes, // Pass doctor's notes to the prescription draft
    });

    await notifyInfoDesk({
      type: 'alert',
      title: 'Prescription Handover',
      message: `Dr. has handed over a prescription for ${admission.patient?.first_name || 'a patient'} ${admission.patient?.last_name || ''}. Ready for encoding.`,
      priority: 'high',
      related_prescription_id: prescription.id,
      related_admission_id: admission.id,
    });

    await AuditLog.create({
      user_id: req.user.id,
      action: 'prescription_handed_over',
      entity_type: 'admission',
      entity_id: admission.id,
      details: { patient_id: admission.patient_id, prescription_id: prescription.id },
      ip_address: req.ip,
    });

    res.json({ success: true, message: 'Consultation completed and handed over to Info Desk.', data: admission });
  } catch (error) { next(error); }
};

