const { 
  Consultation, Admission, Prescription, PrescriptionItem, 
  MedicationSchedule, MedicationLog, QrCode, AuditLog, 
  Notification, Bill, BillItem, Room 
} = require('./src/models');
const sequelize = require('./src/config/db');

async function clearData() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();

    // Disable foreign key checks for truncation
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    console.log('Clearing Audit Logs...');
    await AuditLog.destroy({ where: {}, truncate: true });

    console.log('Clearing Notifications...');
    await Notification.destroy({ where: {}, truncate: true });

    console.log('Clearing Bills & Bill Items...');
    await BillItem.destroy({ where: {}, truncate: true });
    await Bill.destroy({ where: {}, truncate: true });

    console.log('Clearing Medication Logs & Schedules...');
    await MedicationLog.destroy({ where: {}, truncate: true });
    await MedicationSchedule.destroy({ where: {}, truncate: true });

    console.log('Clearing Prescriptions...');
    await PrescriptionItem.destroy({ where: {}, truncate: true });
    await Prescription.destroy({ where: {}, truncate: true });

    console.log('Clearing QR Codes...');
    await QrCode.destroy({ where: {}, truncate: true });

    console.log('Clearing Admissions & Consultations...');
    await Admission.destroy({ where: {}, truncate: true });
    await Consultation.destroy({ where: {}, truncate: true });

    // Reset rooms
    console.log('Resetting Rooms...');
    await Room.update({ is_occupied: false }, { where: {} });

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('✅ Database cleared successfully! Kept User and Patient accounts intact.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to clear database:', error);
    process.exit(1);
  }
}

clearData();
