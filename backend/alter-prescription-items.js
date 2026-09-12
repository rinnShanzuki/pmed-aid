require('dotenv').config();
const sequelize = require('./src/config/db');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    // Remove dosage_unit column
    try {
      await sequelize.query('ALTER TABLE prescription_items DROP COLUMN dosage_unit;');
      console.log('✓ Dropped dosage_unit');
    } catch (e) {
      console.log('Skipped dosage_unit (might not exist):', e.message);
    }

    // Remove duration_unit column
    try {
      await sequelize.query('ALTER TABLE prescription_items DROP COLUMN duration_unit;');
      console.log('✓ Dropped duration_unit');
    } catch (e) {
      console.log('Skipped duration_unit (might not exist):', e.message);
    }

    // Alter duration column to VARCHAR
    try {
      await sequelize.query('ALTER TABLE prescription_items MODIFY COLUMN duration VARCHAR(50) NOT NULL DEFAULT "1 Day";');
      console.log('✓ Altered duration to VARCHAR(50)');
    } catch (e) {
      console.log('Failed to alter duration column:', e.message);
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
