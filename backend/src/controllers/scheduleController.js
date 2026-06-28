const { MedicationSchedule, MedicationLog, PrescriptionItem, Patient, User, AuditLog } = require('../models');
const { Op } = require('sequelize');
const { notifyInfoDesk, createNotification } = require('../utils/notificationHelper');

const SCHEDULE_INCLUDES = [
  { model: PrescriptionItem, as: 'prescriptionItem', attributes: ['medication_name', 'dosage', 'dosage_unit', 'route'] },
  { model: Patient, as: 'patient', attributes: ['id', 'first_name', 'last_name'] },
  { model: User, as: 'administeredBy', attributes: ['id', 'first_name', 'last_name'] },
];

exports.getAll = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.patient_id)   where.patient_id   = req.query.patient_id;
    if (req.query.admission_id) where.admission_id  = req.query.admission_id;
    if (req.query.status)       where.status        = req.query.status;
    if (req.query.date) {
      const d = new Date(req.query.date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.scheduled_time = { [Op.gte]: d, [Op.lt]: next };
    }

    let scheduleIncludes = [...SCHEDULE_INCLUDES];
    
    if (req.user.role === 'nurse') {
      const { Admission } = require('../models');
      scheduleIncludes.push({
        model: Admission,
        as: 'admission',
        where: { assigned_nurse_id: req.user.id },
        attributes: ['id', 'assigned_nurse_id']
      });
    }

    const schedules = await MedicationSchedule.findAll({
      where,
      include: scheduleIncludes,
      order: [['scheduled_time', 'ASC']],
    });
    res.json({ success: true, data: schedules });
  } catch (error) { next(error); }
};

exports.getByPatient = async (req, res, next) => {
  try {
    const where = { patient_id: req.params.patientId };
    if (req.query.status) where.status = req.query.status;

    const schedules = await MedicationSchedule.findAll({
      where, include: SCHEDULE_INCLUDES, order: [['scheduled_time', 'ASC']],
    });
    res.json({ success: true, data: schedules });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const schedule = await MedicationSchedule.findByPk(req.params.id, { include: SCHEDULE_INCLUDES });
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found.' });
    res.json({ success: true, data: schedule });
  } catch (error) { next(error); }
};

exports.administer = async (req, res, next) => {
  try {
    const schedule = await MedicationSchedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found.' });
    if (schedule.status === 'completed') return res.status(400).json({ success: false, message: 'Already administered.' });

    await schedule.update({
      status: 'completed',
      administered_by: req.user.id,
      administered_at: new Date(),
      notes: req.body.notes,
    });

    await MedicationLog.create({
      schedule_id: schedule.id,
      patient_id: schedule.patient_id,
      action: 'administered',
      performed_by: req.user.id,
      notes: req.body.notes,
    });

    await AuditLog.create({
      user_id: req.user.id,
      action: 'dose_administered',
      entity_type: 'medication_schedule',
      entity_id: schedule.id,
      details: { patient_id: schedule.patient_id },
      ip_address: req.ip,
    });

    const fullSchedule = await MedicationSchedule.findByPk(schedule.id, {
      include: [
        { model: PrescriptionItem, as: 'prescriptionItem', attributes: ['medication_name', 'dosage', 'dosage_unit'] },
        { model: Patient, as: 'patient', attributes: ['first_name', 'last_name'] },
      ],
    });
    await notifyInfoDesk({
      type: 'alert',
      title: 'Medication administered',
      message: `${fullSchedule?.patient?.first_name || 'Patient'} ${fullSchedule?.patient?.last_name || ''} received ${fullSchedule?.prescriptionItem?.medication_name || 'a scheduled medication'}.`,
      priority: 'low',
      related_schedule_id: schedule.id,
      related_prescription_id: schedule.prescription_id,
      related_admission_id: schedule.admission_id,
    });

    res.json({ success: true, message: 'Dose administered.', data: schedule });
  } catch (error) { next(error); }
};

exports.confirm = async (req, res, next) => {
  try {
    const schedule = await MedicationSchedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found.' });

    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient || patient.id !== schedule.patient_id) {
      return res.status(403).json({ success: false, message: 'You can only confirm your own medication.' });
    }
    if (schedule.status === 'completed') return res.status(400).json({ success: false, message: 'Already confirmed.' });

    await schedule.update({ status: 'completed', administered_by: req.user.id, administered_at: new Date() });

    await MedicationLog.create({
      schedule_id: schedule.id,
      patient_id: schedule.patient_id,
      action: 'confirmed',
      performed_by: req.user.id,
      notes: 'Patient self-confirmed via app',
    });

    // Notify info desk of patient's home dose confirmation
    const prescriptionItem = await PrescriptionItem.findByPk(schedule.prescription_item_id);
    await notifyInfoDesk({
      type: 'alert',
      title: 'Patient confirmed medication',
      message: `${patient.first_name} ${patient.last_name} confirmed taking ${prescriptionItem?.medication_name || 'medication'} at home.`,
      priority: 'low',
      related_schedule_id: schedule.id,
      related_prescription_id: schedule.prescription_id,
    });

    res.json({ success: true, message: 'Dose confirmed.', data: schedule });
  } catch (error) { next(error); }
};

exports.unconfirm = async (req, res, next) => {
  try {
    const schedule = await MedicationSchedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found.' });

    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient || patient.id !== schedule.patient_id) {
      return res.status(403).json({ success: false, message: 'You can only modify your own medication.' });
    }

    await schedule.update({ status: 'pending', administered_by: null, administered_at: null });
    res.json({ success: true, message: 'Confirmation cancelled.', data: schedule });
  } catch (error) { next(error); }
};

exports.skip = async (req, res, next) => {
  try {
    const schedule = await MedicationSchedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found.' });

    await schedule.update({ status: 'skipped', notes: req.body.notes });

    await MedicationLog.create({
      schedule_id: schedule.id,
      patient_id: schedule.patient_id,
      action: 'skipped',
      performed_by: req.user.id,
      notes: req.body.notes,
    });

    res.json({ success: true, message: 'Dose skipped.', data: schedule });
  } catch (error) { next(error); }
};
