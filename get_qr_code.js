const sequelize = require('./backend/src/config/db');

(async () => {
  try {
    const [results] = await sequelize.query(`
      SELECT s.id as schedule_id, p.id as patient_id, q.code as qr_code 
      FROM schedules s 
      JOIN prescription_items pi ON s.prescription_item_id = pi.id 
      JOIN prescriptions pr ON pi.prescription_id = pr.id 
      JOIN patients p ON pr.patient_id = p.id 
      JOIN qr_codes q ON q.patient_id = p.id 
      WHERE s.status = 'pending' AND q.type = 'in_hospital' 
      LIMIT 1;
    `);
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
