require('dotenv').config();
const sequelize = require('./src/config/db');
const { Prescription, PrescriptionItem, QrCode, MedicationSchedule, Patient, User, AuditLog } = require('./src/models');
const { generateSchedulesForItems } = require('./src/utils/scheduleGenerator');
const { generateQRDataURL } = require('./src/utils/qrGenerator');

async function main() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    // Simulate what the doctor portal sends
    const admission_id = 3;
    const patient_id = 3;
    const doctor_id = null;  // Doctor sends null, controller uses req.user.id
    const type = 'in_hospital';
    const notes = 'Test from doctor portal';
    const items = [{
      medication_name: 'Amoxicillin',
      dosage: '500',
      dosage_unit: 'mg',
      frequency: 1,
      frequency_unit: 'daily',
      duration: 7,
      duration_unit: 'days',
      route: 'oral',
      instructions: 'Take after meals'
    }];

    // Simulate req.user.id = 4 (doctor user)
    const reqUserId = 4;

    console.log('Creating prescription...');
    const prescription = await Prescription.create({
      admission_id, patient_id,
      doctor_id: doctor_id || reqUserId,
      type: type || 'in_hospital',
      notes,
    });
    console.log('Prescription created:', prescription.id);

    console.log('Creating items...');
    const createdItems = await PrescriptionItem.bulkCreate(
      items.map(item => ({ ...item, prescription_id: prescription.id }))
    );
    console.log('Items created:', createdItems.length);

    console.log('Generating schedules...');
    const scheduleEntries = generateSchedulesForItems(
      createdItems.map(i => ({
        ...i.toJSON(),
        prescription_id: prescription.id,
        admission_id,
        patient_id,
      }))
    );
    console.log('Schedule entries:', scheduleEntries.length);

    if (scheduleEntries.length > 0) {
      await MedicationSchedule.bulkCreate(scheduleEntries);
    }

    console.log('Creating QR code...');
    const qrCode = await QrCode.create({
      patient_id,
      admission_id,
      prescription_id: prescription.id,
      type: type || 'in_hospital',
    });
    console.log('QR code created:', qrCode.code);

    console.log('\n=== SUCCESS ===');
    console.log('Prescription ID:', prescription.id);
    console.log('QR Code:', qrCode.code);

  } catch (err) {
    console.error('ERROR:', err.message);
    console.error('Full error:', err);
  } finally {
    await sequelize.close();
  }
}

main();
