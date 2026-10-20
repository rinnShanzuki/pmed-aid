require('dotenv').config();
const { 
  sequelize, User, Patient, Room, Consultation, Admission, 
  Prescription, PrescriptionItem, MedicationSchedule, MedicationLog, 
  QrCode, AuditLog, Notification, Bill, BillItem 
} = require('./src/models');

const DEFAULT_ROOMS = [
  // ICU Rooms
  { room_number: '101', room_type: 'icu', is_occupied: false, price_per_day: 500.00 },
  { room_number: '102', room_type: 'icu', is_occupied: false, price_per_day: 500.00 },
  { room_number: '103', room_type: 'icu', is_occupied: false, price_per_day: 500.00 },

  // Ward Rooms
  { room_number: '201', room_type: 'ward', is_occupied: false, price_per_day: 100.00 },
  { room_number: '202', room_type: 'ward', is_occupied: false, price_per_day: 100.00 },
  { room_number: '203', room_type: 'ward', is_occupied: false, price_per_day: 100.00 },
  { room_number: '204', room_type: 'ward', is_occupied: false, price_per_day: 100.00 },
  { room_number: '205', room_type: 'ward', is_occupied: false, price_per_day: 100.00 },
  { room_number: '206', room_type: 'ward', is_occupied: false, price_per_day: 100.00 },

  // Semi-Private Rooms
  { room_number: '301', room_type: 'semi_private', is_occupied: false, price_per_day: 250.00 },
  { room_number: '302', room_type: 'semi_private', is_occupied: false, price_per_day: 250.00 },
  { room_number: '303', room_type: 'semi_private', is_occupied: false, price_per_day: 250.00 },
  { room_number: '304', room_type: 'semi_private', is_occupied: false, price_per_day: 250.00 },

  // Private Rooms
  { room_number: '401', room_type: 'private', is_occupied: false, price_per_day: 400.00 },
  { room_number: '402', room_type: 'private', is_occupied: false, price_per_day: 400.00 },
  { room_number: '403', room_type: 'private', is_occupied: false, price_per_day: 400.00 },
  { room_number: '404', room_type: 'private', is_occupied: false, price_per_day: 400.00 },
  { room_number: '405', room_type: 'private', is_occupied: false, price_per_day: 400.00 },
];

const STAFF_ACCOUNTS = [
  { email: 'admin@hospital.local', password: 'admin123', first_name: 'System', last_name: 'Admin', role: 'admin' },
  { email: 'infodesk@hospital.local', password: 'infodesk123', first_name: 'Info Desk', last_name: 'Staff', role: 'info_desk' },
  { email: 'doctor@hospital.local', password: 'doctor123', first_name: 'Doctor', last_name: 'Staff', role: 'doctor' },
  { email: 'nurse@hospital.local', password: 'nurse123', first_name: 'Nurse', last_name: 'Staff', role: 'nurse' },
  { email: 'pharmacy@hospital.local', password: 'pharmacy123', first_name: 'Pharmacy', last_name: 'Staff', role: 'pharmacy' }
];

async function refreshDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    await sequelize.sync();

    // Disable foreign keys to allow complete table clears
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    console.log('🧹 Clearing transactional and patient data...');
    await AuditLog.destroy({ where: {}, truncate: true });
    await Notification.destroy({ where: {}, truncate: true });
    await BillItem.destroy({ where: {}, truncate: true });
    await Bill.destroy({ where: {}, truncate: true });
    await MedicationLog.destroy({ where: {}, truncate: true });
    await MedicationSchedule.destroy({ where: {}, truncate: true });
    await PrescriptionItem.destroy({ where: {}, truncate: true });
    await Prescription.destroy({ where: {}, truncate: true });
    await QrCode.destroy({ where: {}, truncate: true });
    await Admission.destroy({ where: {}, truncate: true });
    await Consultation.destroy({ where: {}, truncate: true });
    await Patient.destroy({ where: {}, truncate: true });

    // Remove any registered patient accounts, keeping only staff
    await User.destroy({ where: { role: 'patient' } });

    // Reset or seed rooms
    const currentRoomCount = await Room.count();
    if (currentRoomCount === 0) {
      console.log('🏥 Seeding 18 standard hospital rooms...');
      await Room.bulkCreate(DEFAULT_ROOMS);
    } else {
      console.log('🏥 Resetting all rooms to unoccupied...');
      await Room.update({ is_occupied: false }, { where: {} });
    }

    // Re-enable foreign keys
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    // Ensure staff credentials are active and healthy
    console.log('👥 Verifying staff credentials...');
    for (const acc of STAFF_ACCOUNTS) {
      let existing = await User.scope('withPassword').findOne({ where: { email: acc.email } });
      if (!existing) {
        await User.create({ ...acc, is_active: true });
      } else {
        existing.password = acc.password;
        existing.first_name = acc.first_name;
        existing.last_name = acc.last_name;
        existing.is_active = true;
        await existing.save();
      }
    }

    // Summary
    const [userCount, roomCount, patientCount, consultCount, admitCount] = await Promise.all([
      User.count(),
      Room.count(),
      Patient.count(),
      Consultation.count(),
      Admission.count()
    ]);

    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE REFRESH COMPLETE');
    console.log('='.repeat(50));
    console.log(`👤 Active Staff Users  : ${userCount}`);
    console.log(`🏥 Available Rooms     : ${roomCount} (all unoccupied)`);
    console.log(`🩺 Patients Cleaned    : ${patientCount} (fresh state)`);
    console.log(`📋 Consultations       : ${consultCount}`);
    console.log(`🛏️ Admissions          : ${admitCount}`);
    console.log('='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to refresh database:', error);
    process.exit(1);
  }
}

refreshDatabase();
