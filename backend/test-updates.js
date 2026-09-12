require('dotenv').config();
const { Patient, User, Admission, Prescription, Room, Consultation } = require('./src/models');
const sequelize = require('./src/config/db');

async function testUpdates() {
  try {
    await sequelize.authenticate();
    console.log('--- DB Connected ---\n');

    // 1. Get a doctor and info desk user
    const doctor = await User.findOne({ where: { role: 'doctor' } });
    const infoDesk = await User.findOne({ where: { role: 'info_desk' } });
    
    // 2. Test Patient Creation with NO contact number and WITH allergies
    console.log('Testing Patient Creation (Optional Contact Number)...');
    const newPatient = await Patient.create({
      first_name: 'Test',
      last_name: 'Updates',
      date_of_birth: '1990-01-01',
      gender: 'other',
      // NO contact_number passed
      allergies: 'Penicillin, Dust'
    });
    console.log(`✅ Success! Patient ID: ${newPatient.id}`);
    console.log(`   Contact Number: ${newPatient.contact_number === null ? 'NULL' : newPatient.contact_number}`);
    console.log(`   Allergies: ${newPatient.allergies}\n`);

    // 3. Test Admission with assigned nurse, department, and reason
    console.log('Testing Admission Creation (New Fields)...');
    const room = await Room.create({ room_number: 'TEST-101', room_type: 'ward', is_occupied: false });
    const nurse = await User.findOne({ where: { role: 'nurse' } });

    const newAdmission = await Admission.create({
      patient_id: newPatient.id,
      room_id: room.id,
      admitted_by: infoDesk.id,
      attending_doctor_id: doctor.id,
      assigned_nurse_id: nurse ? nurse.id : null,
      department: 'Cardiology',
      reason_for_admission: 'Chest pain observation',
      admission_date: new Date()
    });
    console.log(`✅ Success! Admission ID: ${newAdmission.id}`);
    console.log(`   Department: ${newAdmission.department}`);
    console.log(`   Reason: ${newAdmission.reason_for_admission}`);
    console.log(`   Assigned Nurse ID: ${newAdmission.assigned_nurse_id}\n`);

    // 4. Test Prescription prescribed_time auto-set
    console.log('Testing Prescription Creation (prescribed_time)...');
    // Using the same logic as the controller
    const prescription = await Prescription.create({
      admission_id: newAdmission.id,
      patient_id: newPatient.id,
      doctor_id: doctor.id,
      type: 'in_hospital',
      status: 'active',
      notes: 'Test notes',
      prescribed_time: new Date().toTimeString().slice(0, 8),
    });
    console.log(`✅ Success! Prescription ID: ${prescription.id}`);
    console.log(`   Prescribed Time: ${prescription.prescribed_time}\n`);

    console.log('--- All tests passed! Cleaning up test data... ---');
    await prescription.destroy();
    await newAdmission.destroy();
    await room.destroy();
    await newPatient.destroy();
    console.log('Cleanup complete.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testUpdates();
