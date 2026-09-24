const sequelize = require('./src/config/db.js');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    await sequelize.query("ALTER TABLE patients ADD COLUMN patient_type ENUM('none', 'outpatient', 'pending_admission', 'admitted') DEFAULT 'none';");
    console.log('Successfully added patient_type column to patients table.');

    process.exit(0);
  } catch (error) {
    console.error('Unable to add column:', error);
    process.exit(1);
  }
})();
