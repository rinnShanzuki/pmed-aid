const sequelize = require('../src/config/db');
async function reset() {
  try {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    const tables = [
      'admissions', 'audit_logs', 'bill_items', 'bills', 'consultations',
      'medication_logs', 'medication_schedules', 'notifications', 'patients',
      'prescription_items', 'prescriptions', 'qr_codes'
    ];
    for (const t of tables) {
      await sequelize.query(`TRUNCATE TABLE ${t};`);
    }
    await sequelize.query("DELETE FROM users WHERE role = 'patient';");
    await sequelize.query("ALTER TABLE users AUTO_INCREMENT = 1;");
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Database refreshed successfully.');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
reset();
