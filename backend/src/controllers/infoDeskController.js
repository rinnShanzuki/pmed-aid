const { Admission, Prescription, Patient, User, QrCode, AuditLog, Room, MedicationSchedule } = require('../models');
const { Op } = require('sequelize');
const { notifyInfoDesk, createNotification } = require('../utils/notificationHelper');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // New admissions today
    const newAdmissions = await Admission.count({
      where: {
        admission_date: { [Op.gte]: today }
      }
    });

    // Active Patients
    const activePatientsCount = await Admission.count({
      where: { status: 'admitted' }
    });

    // Recent prescriptions (last 7 days)
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentPrescriptions = await Prescription.count({
      where: {
        created_at: { [Op.gte]: lastWeek }
      }
    });

    // Pending discharge requests
    const pendingDischargeRequests = await Admission.count({
      where: {
        status: 'admitted',
        discharge_requested: true
      }
    });

    res.json({
      success: true,
      data: {
        newAdmissions,
        activePatients: activePatientsCount,
        recentPrescriptions,
        pendingDischargeRequests
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPendingDischarges = async (req, res, next) => {
  try {
    const admissions = await Admission.findAll({
      where: {
        status: 'admitted',
        discharge_requested: true
      },
      include: [
        { model: Patient, as: 'patient' },
        { model: Room, as: 'room' },
        { model: User, as: 'doctor', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'dischargeRequestedBy', attributes: ['id', 'first_name', 'last_name'] },
        { model: Prescription, as: 'prescriptions', attributes: ['id', 'type', 'created_at'] }
      ],
      order: [['discharge_requested_at', 'ASC']]
    });

    res.json({ success: true, data: admissions });
  } catch (error) {
    next(error);
  }
};

exports.confirmDischarge = async (req, res, next) => {
  try {
    const admission = await Admission.findByPk(req.params.id);
    if (!admission) return res.status(404).json({ success: false, message: 'Admission not found.' });
    if (admission.status === 'discharged') return res.status(400).json({ success: false, message: 'Patient already discharged.' });
    if (!admission.discharge_requested) return res.status(400).json({ success: false, message: 'No discharge request pending.' });

    // Find or ensure there's a take-home prescription
    let dischargePrescription = await Prescription.findOne({
      where: {
        admission_id: admission.id,
        patient_id: admission.patient_id,
        type: 'discharge'
      },
      order: [['created_at', 'DESC']]
    });

    // If body contains prescription items, create discharge prescription if not exists
    if (req.body.items && req.body.items.length > 0 && !dischargePrescription) {
      dischargePrescription = await Prescription.create({
        admission_id: admission.id,
        patient_id: admission.patient_id,
        doctor_id: admission.attending_doctor_id,
        type: 'discharge',
        notes: req.body.notes
      });

      const { PrescriptionItem } = require('../models');
      await PrescriptionItem.bulkCreate(
        req.body.items.map(item => ({ ...item, prescription_id: dischargePrescription.id }))
      );
    }

    // Mark admission as discharge confirmed by info desk
    await admission.update({
      discharge_confirmed_by_desk: true,
      discharge_confirmed_at: new Date()
    });

    await AuditLog.create({
      user_id: req.user.id,
      action: 'discharge_confirmed',
      entity_type: 'admission',
      entity_id: admission.id,
      details: { patient_id: admission.patient_id },
      ip_address: req.ip
    });

    // Generate discharge QR code
    const qrCode = await QrCode.create({
      patient_id: admission.patient_id,
      admission_id: admission.id,
      prescription_id: dischargePrescription?.id || null,
      type: 'discharge'
    });

    const patient = await Patient.findByPk(admission.patient_id);

    // Notify patient of discharge (if patient user exists)
    if (patient && patient.user_id) {
      await createNotification({
        user_id: patient.user_id,
        type: 'alert',
        title: 'You are approved for discharge',
        message: `Your discharge has been approved. Please scan the QR code provided by the information desk to set up your home medication monitoring.`,
        priority: 'high',
        related_admission_id: admission.id
      });
    }

    res.json({
      success: true,
      message: 'Discharge confirmed. QR code generated.',
      data: { admission, discharge_qr_code: qrCode.code, qr_id: qrCode.id }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDischargeQrCodes = async (req, res, next) => {
  try {
    const patient_id = req.params.patientId;
    const qrCodes = await QrCode.findAll({
      where: {
        patient_id,
        type: 'discharge',
        status: 'active'
      },
      include: [
        { model: Prescription, as: 'prescription', attributes: ['id', 'type', 'notes'] },
        { model: Admission, as: 'admission', attributes: ['id', 'discharge_date'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    res.json({ success: true, data: qrCodes });
  } catch (error) {
    next(error);
  }
};

exports.getDischargePrescriptions = async (req, res, next) => {
  try {
    const patient_id = req.params.patientId;
    const prescriptions = await Prescription.findAll({
      where: {
        patient_id,
        type: 'discharge'
      },
      include: [
        { model: require('../models').PrescriptionItem, as: 'items' },
        { model: User, as: 'doctor', attributes: ['id', 'first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    res.json({ success: true, data: prescriptions });
  } catch (error) {
    next(error);
  }
};
