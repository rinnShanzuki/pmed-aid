const { Prescription, Patient, User, Admission } = require('./backend/src/models');

(async () => {
  try {
    const prescriptions = await Prescription.findAll({
      include: [
        { model: User, as: 'doctor', attributes: ['first_name', 'last_name'] },
        { model: Patient, as: 'patient', attributes: ['first_name', 'last_name'] },
        { model: Admission, as: 'admission', attributes: ['id', 'status'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    console.log('\n=== IN-HOSPITAL PRESCRIPTIONS ===');
    prescriptions.filter(p => p.type === 'in_hospital').forEach((p) => {
      console.log(`RX#${p.id} - ${p.patient?.first_name} ${p.patient?.last_name}`);
      console.log(`  Type: ${p.type}`);
      console.log(`  Admission ID: ${p.admission_id || 'NULL'}`);
      console.log(`  Admission Status: ${p.admission?.status || 'N/A'}`);
      console.log(`  Status: ${p.status}`);
      console.log();
    });
  } catch(err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
})();
