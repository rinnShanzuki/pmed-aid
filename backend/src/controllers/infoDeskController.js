const { Admission, Prescription, Patient, User, QrCode, AuditLog, Room, MedicationSchedule, PrescriptionItem } = require('../models');
const { Op } = require('sequelize');
const { notifyInfoDesk, createNotification } = require('../utils/notificationHelper');

// ─── Comprehensive Medication Dashboard (all 6 sections) ───────────────
exports.getMedicationDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // ── 1. Fetch all admitted admissions with joins ──
    const admissions = await Admission.findAll({
      where: { status: 'admitted' },
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'first_name', 'last_name'] },
        { model: Room, as: 'room', attributes: ['id', 'room_number'] },
        { model: User, as: 'doctor', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'assignedNurse', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['admission_date', 'DESC']],
    });

    // ── 2. Fetch today's medication schedules ──
    const schedules = await MedicationSchedule.findAll({
      where: {
        scheduled_time: { [Op.gte]: today, [Op.lt]: tomorrow },
      },
      include: [
        { model: PrescriptionItem, as: 'prescriptionItem', attributes: ['medication_name', 'dosage', 'dosage_unit', 'route'] },
        { model: Patient, as: 'patient', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'administeredBy', attributes: ['id', 'first_name', 'last_name'] },
        {
          model: Admission, as: 'admission', attributes: ['id', 'assigned_nurse_id'],
          include: [
            { model: Room, as: 'room', attributes: ['room_number'] },
            { model: User, as: 'assignedNurse', attributes: ['id', 'first_name', 'last_name'] },
          ],
        },
      ],
      order: [['scheduled_time', 'ASC']],
    });

    // ── 3. Classify schedules ──
    let givenOnTime = 0;
    let overdueMissed = 0;
    let pendingCount = 0;
    let inProgressCount = 0; // administered status = nurse mid-flow
    const pendingScheduleList = [];
    const overdueScheduleList = [];

    for (const s of schedules) {
      const sTime = new Date(s.scheduled_time);
      const medName = s.prescriptionItem
        ? `${s.prescriptionItem.medication_name} ${s.prescriptionItem.dosage}${s.prescriptionItem.dosage_unit}`
        : 'Unknown';
      const nurseName = s.admission?.assignedNurse
        ? `${s.admission.assignedNurse.first_name} ${s.admission.assignedNurse.last_name}`
        : (s.administeredBy ? `${s.administeredBy.first_name} ${s.administeredBy.last_name}` : 'Unassigned');
      const roomNum = s.admission?.room?.room_number || 'N/A';
      const patientName = s.patient ? `${s.patient.first_name} ${s.patient.last_name}` : 'Unknown';

      if (s.status === 'completed' || s.status === 'administered') {
        // If administered before or within a reasonable window → on time
        givenOnTime++;
      } else if (s.status === 'missed') {
        overdueMissed++;
        overdueScheduleList.push({
          scheduleId: s.id,
          patientName,
          roomNumber: roomNum,
          medicationName: medName,
          scheduledTime: s.scheduled_time,
          minutesOverdue: Math.round((now - sTime) / 60000),
          assignedNurse: nurseName,
        });
      } else if (s.status === 'pending') {
        if (sTime < now) {
          // Past due but still pending → overdue
          overdueMissed++;
          overdueScheduleList.push({
            scheduleId: s.id,
            patientName,
            roomNumber: roomNum,
            medicationName: medName,
            scheduledTime: s.scheduled_time,
            minutesOverdue: Math.round((now - sTime) / 60000),
            assignedNurse: nurseName,
          });
        } else {
          pendingCount++;
          // Determine sub-status
          let subStatus = 'pending';
          if (sTime <= oneHourFromNow) subStatus = 'due_now';

          pendingScheduleList.push({
            scheduleId: s.id,
            patientName,
            roomNumber: roomNum,
            medicationName: medName,
            scheduledTime: s.scheduled_time,
            assignedNurse: nurseName,
            status: subStatus,
          });
        }
      } else if (s.status === 'skipped') {
        // skipped doesn't count toward on-time or overdue
      } else if (s.status === 'refused') {
        overdueMissed++;
      }
    }

    const totalDoses = givenOnTime + overdueMissed + pendingCount;
    const givenPct = totalDoses > 0 ? Math.round((givenOnTime / totalDoses) * 100) : 0;
    const overduePct = totalDoses > 0 ? Math.round((overdueMissed / totalDoses) * 100) : 0;

    // ── 4. Build ward overview per admitted patient ──
    // Build a map of patient_id → next pending schedule
    const patientNextMed = {};
    for (const s of schedules) {
      if (s.status === 'pending' && new Date(s.scheduled_time) >= now) {
        if (!patientNextMed[s.patient_id] || new Date(s.scheduled_time) < new Date(patientNextMed[s.patient_id].time)) {
          patientNextMed[s.patient_id] = {
            time: s.scheduled_time,
            name: s.prescriptionItem
              ? `${s.prescriptionItem.medication_name} ${s.prescriptionItem.dosage}${s.prescriptionItem.dosage_unit}`
              : 'Unknown',
          };
        }
      }
    }

    // Determine status per patient
    const patientOverdue = {};
    const patientInProgress = {};
    for (const s of schedules) {
      if (s.status === 'pending' && new Date(s.scheduled_time) < now) {
        patientOverdue[s.patient_id] = true;
      }
      if (s.status === 'administered') {
        patientInProgress[s.patient_id] = true;
      }
    }

    const wardOverview = admissions.map(adm => {
      const pid = adm.patient_id;
      let statusBadge = 'not_yet_due';
      if (patientOverdue[pid]) statusBadge = 'overdue';
      else if (patientInProgress[pid]) statusBadge = 'in_progress';
      else if (patientNextMed[pid]) statusBadge = 'on_track';

      return {
        admissionId: adm.id,
        patientName: adm.patient ? `${adm.patient.first_name} ${adm.patient.last_name}` : 'Unknown',
        roomNumber: adm.room?.room_number || 'N/A',
        attendingPhysician: adm.doctor ? `Dr. ${adm.doctor.first_name} ${adm.doctor.last_name}` : 'N/A',
        assignedNurse: adm.assignedNurse ? `${adm.assignedNurse.first_name} ${adm.assignedNurse.last_name}` : 'Unassigned',
        admissionDate: adm.admission_date,
        statusBadge,
        nextMedDue: patientNextMed[pid]?.time || null,
        nextMedName: patientNextMed[pid]?.name || null,
      };
    });

    // ── 5. Response ──
    res.json({
      success: true,
      data: {
        summary: {
          totalConfined: admissions.length,
          givenOnTime: { count: givenOnTime, pct: givenPct },
          overdueMissed: { count: overdueMissed, pct: overduePct },
          pendingUpcoming: pendingCount,
          inProgress: inProgressCount,
        },
        wardOverview,
        medicationStatus: {
          given: givenOnTime,
          overdue: overdueScheduleList.length,
          missed: schedules.filter(s => s.status === 'missed').length,
          pending: pendingCount,
        },
        pendingSchedule: pendingScheduleList,
        overdueList: overdueScheduleList,
      },
    });
  } catch (error) {
    next(error);
  }
};

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

    // Discharged Patients
    const dischargedPatientsCount = await Admission.count({
      where: { status: 'discharged' }
    });

    // Pending Registrations (patients missing contact info)
    const pendingRegistrationsCount = await Patient.count({
      where: {
        [Op.or]: [
          { contact_number: null },
          { address: null },
          { emergency_contact_name: null }
        ]
      }
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

    // Admission Trend (Last 7 days)
    const trendStartDate = new Date();
    trendStartDate.setDate(trendStartDate.getDate() - 6);
    trendStartDate.setHours(0, 0, 0, 0);

    const admissionsList = await Admission.findAll({
      where: {
        admission_date: { [Op.gte]: trendStartDate }
      },
      attributes: ['admission_date']
    });

    const trendMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(trendStartDate);
      d.setDate(d.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      trendMap[`${dayName} ${dayNum}`] = 0;
    }

    admissionsList.forEach(adm => {
      const d = new Date(adm.admission_date);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const key = `${dayName} ${dayNum}`;
      if (trendMap[key] !== undefined) {
        trendMap[key]++;
      }
    });

    const admissionTrend = Object.keys(trendMap).map(key => ({
      day: key,
      admissions: trendMap[key]
    }));

    // Medication Adherence Trend (Last 7 days)
    const adherenceStartDate = new Date();
    adherenceStartDate.setDate(adherenceStartDate.getDate() - 6);
    adherenceStartDate.setHours(0, 0, 0, 0);

    const allSchedules = await MedicationSchedule.findAll({
      where: {
        scheduled_time: { [Op.gte]: adherenceStartDate },
      },
      attributes: ['scheduled_time', 'status'],
    });

    // Build a map: date string → { given, overdue, total }
    const adherenceMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(adherenceStartDate);
      d.setDate(d.getDate() + i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      adherenceMap[key] = { given: 0, overdue: 0, total: 0 };
    }

    const now = new Date();
    allSchedules.forEach(sched => {
      const d = new Date(sched.scheduled_time);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (adherenceMap[key] === undefined) return;
      adherenceMap[key].total++;
      if (sched.status === 'completed' || sched.status === 'administered') {
        adherenceMap[key].given++;
      } else if (sched.status === 'missed' || sched.status === 'refused') {
        adherenceMap[key].overdue++;
      } else if (sched.status === 'pending' && d < now) {
        // pending but past due → overdue
        adherenceMap[key].overdue++;
      }
    });

    const adherenceTrend = Object.keys(adherenceMap).map(date => {
      const entry = adherenceMap[date];
      return {
        date,
        givenPct: entry.total > 0 ? Math.round((entry.given / entry.total) * 100) : 0,
        overduePct: entry.total > 0 ? Math.round((entry.overdue / entry.total) * 100) : 0,
      };
    });

    res.json({
      success: true,
      data: {
        newAdmissions,
        activePatients: activePatientsCount,
        dischargedPatients: dischargedPatientsCount,
        pendingRegistrations: pendingRegistrationsCount,
        recentPrescriptions,
        pendingDischargeRequests,
        admissionTrend,
        adherenceTrend
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
