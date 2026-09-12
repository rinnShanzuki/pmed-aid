const { Op } = require('sequelize');
const { MedicationSchedule, Admission, Notification, User, Patient } = require('../models');

async function checkAdherence() {
  try {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60000);

    // Find all pending schedules that were due more than 30 minutes ago
    const overdueSchedules = await MedicationSchedule.findAll({
      where: {
        status: 'pending',
        scheduled_time: {
          [Op.lt]: thirtyMinsAgo
        }
      },
      include: [
        {
          model: Admission,
          as: 'admission',
          include: [
            { model: Patient, as: 'patient' },
            { model: User, as: 'assignedNurse' },
            { model: User, as: 'doctor' } // attending doctor
          ]
        }
      ]
    });

    if (overdueSchedules.length === 0) return;

    for (const schedule of overdueSchedules) {
      // 1. Mark as missed
      schedule.status = 'missed';
      await schedule.save();

      const admission = schedule.admission;
      if (!admission) continue;

      const patientName = `${admission.patient?.first_name} ${admission.patient?.last_name}`;
      const title = `Missed Medication Alert`;
      const message = `Dose for ${schedule.medication_name} scheduled at ${new Date(schedule.scheduled_time).toLocaleTimeString()} was missed for patient ${patientName}.`;

      const notificationsToCreate = [];

      // 2. Notify Assigned Nurse
      if (admission.assigned_nurse_id) {
        notificationsToCreate.push({
          user_id: admission.assigned_nurse_id,
          type: 'missed_dose',
          title: title,
          message: message,
          priority: 'high',
          related_schedule_id: schedule.id,
          related_admission_id: admission.id
        });
      }

      // 3. Notify Attending Doctor
      if (admission.attending_doctor_id) {
        notificationsToCreate.push({
          user_id: admission.attending_doctor_id,
          type: 'missed_dose',
          title: title,
          message: message,
          priority: 'critical',
          related_schedule_id: schedule.id,
          related_admission_id: admission.id
        });
      }

      // 4. (Optional) Notify Info Desk/Admin - Let's find an info_desk user
      const infoDesks = await User.findAll({ where: { role: 'info_desk' }, attributes: ['id'] });
      for (const desk of infoDesks) {
        notificationsToCreate.push({
          user_id: desk.id,
          type: 'alert',
          title: `Escalation: ${title}`,
          message: message,
          priority: 'high',
          related_schedule_id: schedule.id,
          related_admission_id: admission.id
        });
      }

      if (notificationsToCreate.length > 0) {
        await Notification.bulkCreate(notificationsToCreate);
      }
    }
  } catch (error) {
    console.error('[AdherenceMonitor] Error running check:', error);
  }
}

// Start the monitor: run every 5 minutes
function startMonitor() {
  console.log('⏰ Adherence Monitor started (runs every 5 mins)...');
  // Run immediately on start
  checkAdherence();
  // Then every 5 mins
  setInterval(checkAdherence, 5 * 60000);
}

module.exports = { startMonitor, checkAdherence };
