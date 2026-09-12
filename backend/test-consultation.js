require('dotenv').config();
const { Consultation, Patient, User } = require('./src/models');
const sequelize = require('./src/config/db');

// Helper to wait
const delay = ms => new Promise(res => setTimeout(res, ms));

async function runTest() {
  try {
    await sequelize.authenticate();
    console.log('--- DB Connected ---\n');

    const doctor = await User.findOne({ where: { role: 'doctor' } });
    const patient = await Patient.findOne(); // grab any patient, e.g. the default one
    
    if (!doctor || !patient) {
      console.log('Missing doctor or patient in db.');
      process.exit(1);
    }

    console.log(`Starting Consultation for Patient: ${patient.first_name} ${patient.last_name}`);
    console.log(`Assigned Doctor: Dr. ${doctor.first_name} ${doctor.last_name}`);
    
    // 1. Create Consultation (Simulating Queueing from Info Desk)
    const consultation = await Consultation.create({
      patient_id: patient.id,
      doctor_id: doctor.id,
      notes: 'Initial triage complete. Awaiting doctor.',
      status: 'waiting'
    });

    const createdAt = new Date(consultation.created_at);
    console.log(`\n🕒 Consultation Queued at (created_at): ${createdAt.toLocaleTimeString()}`);
    console.log(`   (Notice there is no 'scheduled_time' set. The system now uses the queue time.)`);

    // Wait 3 seconds to simulate time passing during the consultation
    console.log('\nDoctor is evaluating the patient (waiting 3 seconds)...');
    await delay(3000);

    // 2. Complete Consultation
    await consultation.update({
      status: 'completed',
      assessment: 'Patient is healthy.',
      doctor_notes: 'General checkup completed.',
    });

    // 3. Re-fetch to get the exact database timestamps
    const finishedConsultation = await Consultation.findByPk(consultation.id);
    const updatedAt = new Date(finishedConsultation.updated_at);

    console.log(`\n🕒 Consultation Ended at (updated_at): ${updatedAt.toLocaleTimeString()}`);
    
    // Assert the difference
    const diff = (updatedAt.getTime() - createdAt.getTime()) / 1000;
    console.log(`\n✅ Success! The patient history will now show the end time: ${updatedAt.toLocaleTimeString()}`);
    console.log(`   Session duration was ${diff} seconds.`);

    // Cleanup
    console.log('\n--- Cleaning up test data ---');
    await finishedConsultation.destroy();
    
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

runTest();
