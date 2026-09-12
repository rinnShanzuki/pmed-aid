const { sequelize, Admission, MedicationSchedule, Prescription, PrescriptionItem, Patient, Room, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

exports.overview = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const admWhere = { status: 'admitted' };
    if (req.user.role === 'nurse') admWhere.assigned_nurse_id = req.user.id;
    if (req.user.role === 'doctor') admWhere.attending_doctor_id = req.user.id;

    // Build the include for MedicationSchedule based on role
    let scheduleInclude = [];
    if (req.user.role === 'nurse') {
      scheduleInclude = [{
        model: Admission,
        as: 'admission',
        where: { assigned_nurse_id: req.user.id },
        attributes: [],
      }];
    } else if (req.user.role === 'doctor') {
      scheduleInclude = [{
        model: Admission,
        as: 'admission',
        where: { attending_doctor_id: req.user.id },
        attributes: [],
      }];
    }

    const [activeAdmissions, totalPatients, activePrescriptions, todayStats, overdue] = await Promise.all([
      Admission.count({ where: admWhere }),
      Patient.count(), // We'll keep total patients hospital-wide or change? Let's leave it, not used heavily on doctor dashboard. Wait, doctor dashboard doesn't even show total patients.
      Prescription.count({ where: { status: 'active', ...(req.user.role === 'doctor' && { doctor_id: req.user.id }) } }),
      MedicationSchedule.findAll({
        where: { scheduled_time: { [Op.gte]: today, [Op.lt]: tomorrow } },
        include: scheduleInclude,
        attributes: [
          'MedicationSchedule.status',
          [fn('COUNT', col('MedicationSchedule.id')), 'count'],
        ],
        group: ['MedicationSchedule.status'],
        raw: true,
      }),
      MedicationSchedule.count({
        where: {
          status: 'pending',
          scheduled_time: { [Op.lt]: new Date() },
        },
        include: scheduleInclude,
      }),
    ]);

    const statsMap = todayStats.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        active_admissions: activeAdmissions,
        total_patients: totalPatients,
        active_prescriptions: activePrescriptions,
        today: {
          total_doses: Object.values(statsMap).reduce((a, b) => a + b, 0),
          completed: statsMap.completed || 0,
          pending: statsMap.pending || 0,
          missed: statsMap.missed || 0,
          skipped: statsMap.skipped || 0,
        },
        overdue_count: overdue,
      },
    });
  } catch (error) { next(error); }
};

exports.medicationStatus = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    let scheduleInclude = [];
    if (req.user.role === 'nurse') {
      scheduleInclude = [{
        model: Admission,
        as: 'admission',
        where: { assigned_nurse_id: req.user.id },
        attributes: ['id', 'patient_id', 'room_id'],
        include: [
          { model: Patient, as: 'patient', attributes: ['first_name', 'last_name'] },
          { model: Room, as: 'room', attributes: ['room_number', 'room_type'] },
        ],
      }];
    } else if (req.user.role === 'doctor') {
      scheduleInclude = [{
        model: Admission,
        as: 'admission',
        where: { attending_doctor_id: req.user.id },
        attributes: ['id', 'patient_id', 'room_id'],
        include: [
          { model: Patient, as: 'patient', attributes: ['first_name', 'last_name'] },
          { model: Room, as: 'room', attributes: ['room_number', 'room_type'] },
        ],
      }];
    } else {
      scheduleInclude = [{
        model: Admission,
        as: 'admission',
        attributes: ['id', 'patient_id', 'room_id'],
        include: [
          { model: Patient, as: 'patient', attributes: ['first_name', 'last_name'] },
          { model: Room, as: 'room', attributes: ['room_number', 'room_type'] },
        ],
      }];
    }

    const schedules = await MedicationSchedule.findAll({
      where: { scheduled_time: { [Op.gte]: today, [Op.lt]: tomorrow } },
      include: [
        { model: PrescriptionItem, as: 'prescriptionItem', attributes: ['medication_name', 'dosage', 'route'] },
        { model: Patient, as: 'patient', attributes: ['id', 'first_name', 'last_name'] },
        ...scheduleInclude,
        { model: User, as: 'administeredBy', attributes: ['first_name', 'last_name'] },
      ],
      order: [['scheduled_time', 'ASC']],
    });

    // Group by patient
    const patientMap = {};
    for (const s of schedules) {
      const pid = s.patient_id;
      if (!patientMap[pid]) {
        patientMap[pid] = {
          patient_id: pid,
          patient_name: `${s.patient.first_name} ${s.patient.last_name}`,
          room_number: s.admission?.room?.room_number || 'N/A',
          schedules: [],
        };
      }
      patientMap[pid].schedules.push({
        id: s.id,
        medication_name: s.prescriptionItem?.medication_name,
        dosage: `${s.prescriptionItem?.dosage}`,
        route: s.prescriptionItem?.route,
        scheduled_time: s.scheduled_time,
        status: s.status,
        administered_by: s.administeredBy ? `${s.administeredBy.first_name} ${s.administeredBy.last_name}` : null,
        administered_at: s.administered_at,
      });
    }

    res.json({ success: true, data: Object.values(patientMap) });
  } catch (error) { next(error); }
};

exports.alerts = async (req, res, next) => {
  try {
    const overdue = await MedicationSchedule.findAll({
      where: {
        status: 'pending',
        scheduled_time: { [Op.lt]: new Date() },
      },
      include: [
        { model: Patient, as: 'patient', attributes: ['first_name', 'last_name'] },
        { model: PrescriptionItem, as: 'prescriptionItem', attributes: ['medication_name', 'dosage'] },
        {
          model: Admission, as: 'admission',
          attributes: ['id', 'patient_id', 'room_id'],
          where: req.user.role === 'nurse' ? { assigned_nurse_id: req.user.id } :
            req.user.role === 'doctor' ? { attending_doctor_id: req.user.id } : undefined,
          include: [{ model: Room, as: 'room', attributes: ['room_number'] }],
        },
      ],
      order: [['scheduled_time', 'ASC']],
    });

    const alerts = overdue.map(s => ({
      id: s.id,
      type: 'overdue',
      priority: 'high',
      patient_name: `${s.patient.first_name} ${s.patient.last_name}`,
      room_number: s.admission?.room?.room_number || 'N/A',
      medication: `${s.prescriptionItem?.medication_name} ${s.prescriptionItem?.dosage}`,
      scheduled_time: s.scheduled_time,
      minutes_overdue: Math.round((new Date() - new Date(s.scheduled_time)) / 60000),
    }));

    res.json({ success: true, data: alerts });
  } catch (error) { next(error); }
};

exports.patientTimeline = async (req, res, next) => {
  try {
    const schedules = await MedicationSchedule.findAll({
      where: { patient_id: req.params.patientId },
      include: [{ model: PrescriptionItem, as: 'prescriptionItem' }],
      order: [['scheduled_time', 'ASC']],
    });

    const summary = await MedicationSchedule.findAll({
      where: { patient_id: req.params.patientId },
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    const summaryMap = summary.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {});

    res.json({ success: true, data: { schedules, summary: summaryMap } });
  } catch (error) { next(error); }
};
