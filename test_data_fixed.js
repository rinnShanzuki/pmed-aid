const sequelize = require('./backend/src/config/db');
const { Patient, User, Consultation, Admission, Room, QrCode, Prescription, PrescriptionItem, Medication, MedicationSchedule } = require('./backend/src/models');
const crypto = require('crypto');

(async () => {
  try {
    await sequelize.authenticate();

    let doctor = await User.findOne({ where: { role: 'doctor' }});
    let infoDesk = await User.findOne({ where: { role: 'info_desk' }});
    if (!doctor || !infoDesk) { console.log('Need users'); process.exit(1); }

    let patient = await Patient.create({
      first_name: 'Testy',
      last_name: 'McScan',
      gender: 'male',
      date_of_birth: '1980-05-05',
      patient_type: 'admitted'
    });
    
    // Assumes room 1 exists, if not create
    let room = await Room.findOne();
    if(!room) { room = await Room.create({ room_number: '101', type: 'ward', price_per_day: 1000, is_occupied: true }); }
    else { await room.update({is_occupied: true}); }

    const admission = await Admission.create({
      patient_id: patient.id,
      room_id: room.id,
      admission_date: new Date(),
      status: 'admitted',
      admitted_by: infoDesk.id,
      attending_doctor_id: doctor.id
    });

    const qr = await QrCode.create({
      patient_id: patient.id,
      admission_id: admission.id,
      type: 'in_hospital',
      code: crypto.randomUUID()
    });
    
    const rx = await Prescription.create({
      patient_id: patient.id,
      doctor_id: doctor.id,
      type: 'in_hospital',
      status: 'active'
    });
    
    let med = await Medication.findOne();
    if(!med) med = await Medication.create({ name: 'Paracetamol', type: 'tablet', current_stock: 100, unit_price: 10 });
    
    const item = await PrescriptionItem.create({
      prescription_id: rx.id,
      medication_id: med.id,
      medication_name: med.name,
      dosage: '500mg',
      frequency: 1,
      route: 'PO'
    });

    await MedicationSchedule.create({
      prescription_item_id: item.id,
      prescription_id: rx.id,
      patient_id: patient.id,
      scheduled_time: new Date(),
      status: 'pending'
    });
    
    console.log('Created test data successfully. Ready for scan test.');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
