require('dotenv').config();
const app = require('./app');
const { sequelize, User, Patient, Room, Admission, Prescription, PrescriptionItem, MedicationSchedule, QrCode } = require('./models');
const { startMonitor } = require('./cron/adherenceMonitor');

const PORT = process.env.PORT || 5000;

async function ensureDefaultAccounts() {
  try {
    const testAccounts = [
      { email: 'admin@hospital.local', password: 'admin123', first_name: 'Admin', last_name: 'User', role: 'admin' },
      { email: 'infodesk@hospital.local', password: 'infodesk123', first_name: 'Rinn', last_name: 'Espinosa', role: 'info_desk' },
      { email: 'doctor@hospital.local', password: 'doctor123', first_name: 'Dr. Ruiz', last_name: 'Cruz', role: 'doctor' },
      { email: 'nurse@hospital.local', password: 'nurse123', first_name: 'Maria', last_name: 'Santos', role: 'nurse' },
      { email: 'pharmacy@hospital.local', password: 'pharmacy123', first_name: 'Pharm', last_name: 'Manager', role: 'pharmacy' }
    ];

    for (const account of testAccounts) {
      let existing = await User.scope('withPassword').findOne({ where: { email: account.email } });
      if (!existing) {
        existing = await User.create({ ...account, is_active: true });
        console.log(`✅ Auto-created account: ${account.email}`);
      } else {
        const isMatch = await existing.comparePassword(account.password);
        if (!isMatch || !existing.is_active) {
          existing.password = account.password;
          existing.is_active = true;
          await existing.save();
          console.log(`✅ Auto-synced credentials for: ${account.email}`);
        }
      }

      // Auto-seed patient profile and active medications/schedules for patient test accounts
      if (account.role === 'patient' && existing) {
        let patientProfile = await Patient.findOne({ where: { user_id: existing.id } });
        if (!patientProfile) {
          patientProfile = await Patient.findOne({ where: { first_name: account.first_name, last_name: account.last_name } });
          if (patientProfile) {
            patientProfile.user_id = existing.id;
            await patientProfile.save();
          } else {
            patientProfile = await Patient.create({
              user_id: existing.id,
              first_name: account.first_name,
              last_name: account.last_name,
              date_of_birth: '1988-05-14',
              gender: account.first_name === 'Jane' ? 'female' : 'male',
              contact_number: '+63 912 345 6789',
              address: '123 Health Ave, Medical City',
              blood_type: 'O+',
              allergies: 'None'
            });
          }
          console.log(`✅ Auto-linked Patient profile for: ${account.email}`);
        }

        // Check if this patient has any prescriptions
        if (patientProfile) {
          const rxCount = await Prescription.count({ where: { patient_id: patientProfile.id } });
          if (rxCount === 0) {
            // Find or create an admission
            let admission = await Admission.findOne({ where: { patient_id: patientProfile.id } });
            if (!admission) {
              const doctorUser = await User.findOne({ where: { role: 'doctor' } });
              const infoDeskUser = await User.findOne({ where: { role: 'info_desk' } });
              const room = await Room.findOne({ where: { is_occupied: false } });
              
              admission = await Admission.create({
                patient_id: patientProfile.id,
                room_id: room ? room.id : 1,
                admitted_by: infoDeskUser ? infoDeskUser.id : 1,
                admission_date: new Date(),
                status: 'admitted',
                notes: 'Routine monitoring and post-op recovery',
                diagnosis: 'Hypertension & Vitamin D deficiency',
                attending_doctor_id: doctorUser ? doctorUser.id : null
              });
            }

            // Create prescription
            const rx = await Prescription.create({
              admission_id: admission.id,
              patient_id: patientProfile.id,
              doctor_id: admission.attending_doctor_id || existing.id,
              type: 'in_hospital',
              status: 'active',
              notes: 'Take with plenty of water after meals'
            });

            const item1 = await PrescriptionItem.create({
              prescription_id: rx.id,
              medication_name: 'Amoxicillin 500mg',
              dosage: '500',
              dosage_unit: 'mg',
              frequency: 3,
              frequency_unit: 'daily',
              interval_hours: 8,
              route: 'oral',
              duration: 7,
              duration_unit: 'days',
              instructions: 'Take 1 capsule every 8 hours after food',
            });

            const item2 = await PrescriptionItem.create({
              prescription_id: rx.id,
              medication_name: 'Paracetamol 500mg',
              dosage: '500',
              dosage_unit: 'mg',
              frequency: 2,
              frequency_unit: 'daily',
              interval_hours: 12,
              route: 'oral',
              duration: 5,
              duration_unit: 'days',
              instructions: 'Take for fever or pain as needed',
            });

            // Create schedules for today & tomorrow
            const now = new Date();
            const schedulesToCreate = [];
            [-4, -1, 2, 6, 12, 24].forEach((hoursOffset, idx) => {
              const time = new Date(now.getTime() + hoursOffset * 60 * 60 * 1000);
              const isPast = hoursOffset < 0;
              schedulesToCreate.push({
                prescription_id: rx.id,
                prescription_item_id: idx % 2 === 0 ? item1.id : item2.id,
                admission_id: admission.id,
                patient_id: patientProfile.id,
                scheduled_time: time,
                status: isPast ? 'completed' : 'pending',
                administered_by: isPast ? (admission.attending_doctor_id || 1) : null,
                administered_at: isPast ? time : null,
              });
            });

            await MedicationSchedule.bulkCreate(schedulesToCreate);
            console.log(`✅ Auto-seeded prescription and schedules for: ${account.email}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('⚠️ Could not verify default accounts:', err.message);
  }
}

function startServer() {
  // Start HTTP server immediately so cloud health checks pass and port opens without blocking on DB
  app.listen(PORT, () => {
    console.log(`🚀 Server running → http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Initialize DB and background tasks asynchronously
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('✅ MySQL database connected');

      await sequelize.sync();
      console.log('✅ Database models synced');

      await ensureDefaultAccounts();
      startMonitor();
    } catch (error) {
      console.error('❌ Database initialization warning:', error.message);
    }
  })();
}

startServer();


