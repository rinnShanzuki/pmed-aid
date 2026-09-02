const { Consultation, Admission, Patient, User, Room, QrCode } = require('./src/models');
const sequelize = require('./src/config/db');

async function testNewFields() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    
    // 1. Get any doctor and patient
    const doctor = await User.findOne({ where: { role: 'doctor' } });
    let patient = await Patient.findOne();
    
    if (!patient) {
        patient = await Patient.create({
            first_name: 'Test',
            last_name: 'Patient',
            date_of_birth: '1990-01-01',
            gender: 'Male',
            contact_number: '1234567890',
            address: '123 Test St'
        });
    }

    if (!doctor) {
        console.error("No doctor found in DB to test with.");
        process.exit(1);
    }

    console.log('--- Testing Consultation ---');
    const consultation = await Consultation.create({
      patient_id: patient.id,
      doctor_id: doctor.id,
      notes: 'General checkup',
      department: 'Cardiology',
      chief_complaint: 'Chest pain',
      hpi: 'Patient reports chest pain since yesterday.',
      symptoms: 'Nausea, sweating',
      findings: 'Elevated BP',
      vital_signs: { bp: '140/90', hr: 100, temp: 37.5 },
      assessment: 'Possible hypertension',
      follow_up_date: new Date('2026-09-01'),
    });
    
    console.log('Consultation Created Successfully!');
    console.log('- Department:', consultation.department);
    console.log('- Chief Complaint:', consultation.chief_complaint);
    console.log('- Vitals:', consultation.vital_signs);

    console.log('\n--- Testing Admission ---');
    let room = await Room.findOne();
    if (!room) {
        room = await Room.create({ room_number: '101', type: 'General', price_per_day: 1000, capacity: 1, is_occupied: false });
    }

    const admission = await Admission.create({
      patient_id: patient.id,
      room_id: room.id,
      admitted_by: doctor.id,
      attending_doctor_id: doctor.id,
      department: 'Cardiology Ward',
      reason_for_admission: 'Observation for chest pain',
      treatment_plan: 'Monitor BP, ECG',
      progress_notes: 'Patient stable.',
      nurse_notes: 'Vitals taken hourly.',
      final_diagnosis: 'Hypertension',
      condition_at_discharge: 'Stable',
      discharge_summary: 'Patient responded well to meds.',
      discharge_assessment: 'Fit for discharge',
      follow_up_date: new Date('2026-09-05'),
      follow_up_instructions: 'Take meds daily.',
    });

    console.log('Admission Created Successfully!');
    console.log('- Reason:', admission.reason_for_admission);
    console.log('- Progress Notes:', admission.progress_notes);
    console.log('- Final Diagnosis:', admission.final_diagnosis);

    console.log('\n--- Testing QrCode ---');
    const qrCode = await QrCode.create({
        patient_id: patient.id,
        admission_id: admission.id,
        type: 'in_hospital',
        first_scan_date: new Date(),
        last_scan_date: new Date(),
        expiration_date: new Date('2026-12-31')
    });

    console.log('QrCode Created Successfully!');
    console.log('- First Scan Date:', qrCode.first_scan_date);
    console.log('- Expiration Date:', qrCode.expiration_date);

    // Clean up test data
    console.log('\nCleaning up test data...');
    await QrCode.destroy({ where: { id: qrCode.id } });
    await Admission.destroy({ where: { id: admission.id } });
    await Consultation.destroy({ where: { id: consultation.id } });

    console.log('✅ All tests passed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testNewFields();
