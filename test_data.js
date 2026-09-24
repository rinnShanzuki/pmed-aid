const sequelize = require('./backend/src/config/db');
const { Patient, User, Consultation, Admission, Room, QrCode, Prescription, PrescriptionItem, Medication, MedicationSchedule } = require('./backend/src/models');

(async () => {
  try {
    // Sync models just in case
    await sequelize.authenticate();

    // Check if there's any admitted patient
    let patient = await Patient.findOne({ where: { patient_type: 'admitted' }});
    if (!patient) {
      console.log('No admitted patient found. Creating one...');
      patient = await Patient.create({
        first_name: 'Test',
        last_name: 'AdmittedPatient',
        gender: 'male',
        date_of_birth: '1990-01-01',
        patient_type: 'admitted'
      });
      
      const admission = await Admission.create({
        patient_id: patient.id,
        room_id: 1, // assume room 1 exists
        admission_date: new Date(),
        status: 'admitted'
      });

      const qr = await QrCode.create({
        patient_id: patient.id,
        admission_id: admission.id,
        type: 'in_hospital',
        code: require('crypto').randomUUID()
      });
      
      const rx = await Prescription.create({
        patient_id: patient.id,
        doctor_id: 2, // assume doctor exists
        type: 'in_hospital',
        status: 'active'
      });
      
      const med = await Medication.findOne();
      
      const item = await PrescriptionItem.create({
        prescription_id: rx.id,
        medication_id: med.id,
        medication_name: med.name,
        dosage: '1 tablet',
        frequency: 'QD',
        route: 'PO'
      });

      await MedicationSchedule.create({
        prescription_item_id: item.id,
        scheduled_time: new Date(),
        status: 'pending'
      });
      
      console.log('Created test data.');
    } else {
      console.log('Found admitted patient:', patient.id);
      
      // Ensure they have a pending schedule
      const scheds = await MedicationSchedule.findAll({
        include: [
          {
            model: PrescriptionItem,
            as: 'prescriptionItem',
            include: [{ model: Prescription, as: 'prescription', where: { patient_id: patient.id } }]
          }
        ]
      });
      
      let pending = scheds.find(s => s.status === 'pending');
      if (!pending) {
        console.log('No pending schedule, creating one...');
        const item = await PrescriptionItem.findOne({ include: [{ model: Prescription, as: 'prescription', where: { patient_id: patient.id } }] });
        if (item) {
          await MedicationSchedule.create({
            prescription_item_id: item.id,
            scheduled_time: new Date(),
            status: 'pending'
          });
        }
      }
      console.log('Test data is ready.');
    }
    
    // Get the QR code
    const qr = await QrCode.findOne({ where: { patient_id: patient.id, type: 'in_hospital' }});
    console.log('QR CODE:', qr.code);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
