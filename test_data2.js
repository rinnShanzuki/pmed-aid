const sequelize = require('./backend/src/config/db');
const { Patient, User, Consultation, Admission, Room, QrCode, Prescription, PrescriptionItem, Medication, MedicationSchedule } = require('./backend/src/models');

(async () => {
  try {
    await sequelize.authenticate();

    // Ensure they have a pending schedule
    const scheds = await MedicationSchedule.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: PrescriptionItem,
          as: 'prescriptionItem',
          include: [{ model: Prescription, as: 'prescription' }]
        }
      ]
    });
    
    if (scheds.length === 0) {
      console.log('No pending schedules at all.');
      process.exit(0);
    }

    const s = scheds[0];
    const pId = s.prescriptionItem.prescription.patient_id;

    // Get the QR code
    const qr = await QrCode.findOne({ where: { patient_id: pId, type: 'in_hospital' }});
    if (qr) {
      console.log('QR CODE:', qr.code);
    } else {
      console.log('Patient has no in_hospital QR code');
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
