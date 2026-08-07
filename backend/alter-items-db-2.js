const sequelize = require('./src/config/db');

async function alterDb() {
  try {
    await sequelize.query('ALTER TABLE prescription_items DROP COLUMN time_to_take;');
    await sequelize.query('ALTER TABLE prescription_items ADD COLUMN start_time TIME;');
    await sequelize.query('ALTER TABLE prescription_items ADD COLUMN interval_hours FLOAT;');
    console.log('Successfully altered prescription_items table!');
    process.exit(0);
  } catch (err) {
    console.error('Error altering database:', err);
    process.exit(1);
  }
}

alterDb();
