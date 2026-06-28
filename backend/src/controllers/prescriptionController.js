const { Prescription, PrescriptionItem, MedicationSchedule, Patient, User, AuditLog, QrCode } = require('../models');
const { generateSchedulesForItems } = require('../utils/scheduleGenerator');
const { generateQRDataURL } = require('../utils/qrGenerator');
const { validationResult } = require('express-validator');
const { notifyInfoDesk } = require('../utils/notificationHelper');

exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { admission_id, patient_id, doctor_id, type, notes, items, status } = req.body;

    const prescription = await Prescription.create({
      admission_id, patient_id,
      doctor_id: doctor_id || req.user.id,
      type: type || 'in_hospital',
      status: status || 'active',
      notes,
    });

    if (status === 'pending_encoding' || !items || items.length === 0) {
      // Skip item and QR generation if handed over without items
      return res.status(201).json({
        success: true,
        data: prescription,
        meta: { schedules_generated: 0 },
      });
    }

    const createdItems = await PrescriptionItem.bulkCreate(
      items.map(item => ({ ...item, prescription_id: prescription.id }))
    );

    const scheduleEntries = generateSchedulesForItems(
      createdItems.map(i => ({
        ...i.toJSON(),
        prescription_id: prescription.id,
        admission_id,
        patient_id,
      }))
    );

    if (scheduleEntries.length > 0) {
      await MedicationSchedule.bulkCreate(scheduleEntries);
    }

    const patient = await Patient.findByPk(patient_id, { attributes: ['first_name', 'last_name'] });
    await notifyInfoDesk({
      type: 'alert',
      title: type === 'discharge' ? 'Take-home prescription ready' : 'Prescription ready for QR processing',
      message: `${patient ? `${patient.first_name} ${patient.last_name}` : 'A patient'} has a ${type === 'discharge' ? 'take-home' : 'in-hospital'} prescription ready for review and QR generation.`,
      priority: type === 'discharge' ? 'high' : 'medium',
      related_prescription_id: prescription.id,
      related_admission_id: admission_id,
    });

    await AuditLog.create({
      user_id: req.user.id,
      action: 'prescription_created',
      entity_type: 'prescription',
      entity_id: prescription.id,
      details: { type, items_count: items.length, schedules_generated: scheduleEntries.length },
      ip_address: req.ip,
    });

    const full = await Prescription.findByPk(prescription.id, {
      include: [{ model: PrescriptionItem, as: 'items' }],
    });

    const qrCode = await QrCode.create({
      patient_id,
      admission_id,
      prescription_id: prescription.id,
      type: type || 'in_hospital',
    });

    const qrImage = await generateQRDataURL(qrCode.code);

    res.status(201).json({
      success: true,
      data: full,
      qr_code: qrCode.code,
      qr_image: qrImage,
      meta: { schedules_generated: scheduleEntries.length },
    });
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.patient_id) where.patient_id = req.query.patient_id;
    if (req.query.admission_id) where.admission_id = req.query.admission_id;
    if (req.query.status) where.status = req.query.status;
    if (req.query.type) where.type = req.query.type;

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ where: { user_id: req.user.id } });
      if (!patient) return res.json({ success: true, data: [] });
      where.patient_id = patient.id;
    }

    const prescriptions = await Prescription.findAll({
      where,
      include: [
        { model: PrescriptionItem, as: 'items' },
        { model: User, as: 'doctor', attributes: ['id', 'first_name', 'last_name'] },
        { model: Patient, as: 'patient', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: prescriptions });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findByPk(req.params.id, {
      include: [
        { model: PrescriptionItem, as: 'items' },
        { model: User, as: 'doctor', attributes: ['id', 'first_name', 'last_name'] },
        { model: Patient, as: 'patient' },
      ],
    });
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found.' });
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ where: { user_id: req.user.id } });
      if (!patient || patient.id !== prescription.patient_id) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }
    res.json({ success: true, data: prescription });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const prescription = await Prescription.findByPk(req.params.id);
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found.' });
    await prescription.update(req.body);
    res.json({ success: true, data: prescription });
  } catch (error) { next(error); }
};

exports.addItems = async (req, res, next) => {
  try {
    const { items, notes } = req.body;
    if (!items?.length) return res.status(400).json({ success: false, message: 'Items array required.' });

    const prescription = await Prescription.findByPk(req.params.id);
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found.' });

    if (notes) await prescription.update({ notes });

    const createdItems = await PrescriptionItem.bulkCreate(
      items.map(i => ({ ...i, prescription_id: prescription.id }))
    );

    const scheduleEntries = generateSchedulesForItems(
      createdItems.map(i => ({
        ...i.toJSON(),
        prescription_id: prescription.id,
        admission_id: prescription.admission_id,
        patient_id: prescription.patient_id,
      }))
    );
    if (scheduleEntries.length > 0) await MedicationSchedule.bulkCreate(scheduleEntries);

    let qrCodeCode = null;
    if (prescription.status === 'pending_encoding') {
      await prescription.update({ status: 'active' });
      // Generate QR since it wasn't generated during handover
      const qrCode = await QrCode.create({
        patient_id: prescription.patient_id,
        admission_id: prescription.admission_id,
        prescription_id: prescription.id,
        type: prescription.type || 'in_hospital',
      });
      qrCodeCode = qrCode.code;
    }

    const patient = await Patient.findByPk(prescription.patient_id, { attributes: ['first_name', 'last_name'] });
    await notifyInfoDesk({
      type: 'alert',
      title: 'Prescription updated',
      message: `${patient ? `${patient.first_name} ${patient.last_name}` : 'A patient'} has newly added prescription items ready for review.`,
      priority: 'medium',
      related_prescription_id: prescription.id,
      related_admission_id: prescription.admission_id,
    });

    let qrImage = null;
    if (qrCodeCode) {
      qrImage = await generateQRDataURL(qrCodeCode);
    }

    const full = await Prescription.findByPk(prescription.id, {
      include: [{ model: PrescriptionItem, as: 'items' }],
    });
    res.status(201).json({ success: true, data: full, qr_code: qrCodeCode, qr_image: qrImage, meta: { schedules_generated: scheduleEntries.length } });
  } catch (error) { next(error); }
};

exports.updateItem = async (req, res, next) => {
  try {
    const item = await PrescriptionItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
    await item.update(req.body);
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};
