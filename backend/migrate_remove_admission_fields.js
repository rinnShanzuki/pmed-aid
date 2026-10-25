const sequelize = require('./src/config/db');

async function run() {
  try {
    console.log('Dropping department and reason_for_admission columns from admissions table...');
    try {
      await sequelize.query("ALTER TABLE admissions DROP COLUMN department");
      console.log('Successfully dropped department column from admissions.');
    } catch (e) {
      console.log('Note (department):', e.message);
    }

    try {
      await sequelize.query("ALTER TABLE admissions DROP COLUMN reason_for_admission");
      console.log('Successfully dropped reason_for_admission column from admissions.');
    } catch (e) {
      console.log('Note (reason_for_admission):', e.message);
    }

    console.log('Database migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
