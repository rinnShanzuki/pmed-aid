require('dotenv').config();
const { Prescription, PrescriptionItem, Patient, User } = require('./src/models');

async function testPrescription() {
  try {
    // Find a valid patient
    const patient = await Patient.findOne();
    if (!patient) {
      console.log('No patients found in DB. Test skipped.');
      process.exit(0);
    }

    // Find a valid doctor
    const doctor = await User.findOne({ where: { role: 'doctor' } });
    if (!doctor) {
      console.log('No doctors found in DB. Test skipped.');
      process.exit(0);
    }

    console.log(`Using Patient ID: ${patient.id}, Doctor ID: ${doctor.id}`);

    const rx = await Prescription.create({
      patient_id: patient.id,
      doctor_id: doctor.id,
      type: 'outpatient',
      notes: 'Test note for dosage/duration schema'
    });

    const item = await PrescriptionItem.create({
      prescription_id: rx.id,
      medication_name: 'Test Med',
      dosage: '500 mg',
      frequency: 2,
      frequency_unit: 'daily',
      duration: '7 Days',
      route: 'oral',
      status: 'active'
    });

    console.log('\n--- SUCCESS: TEST PRESCRIPTION CREATED ---');
    console.log(item.toJSON());
    console.log('------------------------------------------\n');
    
    // clean up
    await PrescriptionItem.destroy({ where: { id: item.id }});
    await Prescription.destroy({ where: { id: rx.id }});
    console.log('Cleanup complete.');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testPrescription();
