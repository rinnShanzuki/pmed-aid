const sequelize = require('./src/config/db');

async function alterDb() {
  try {
    await sequelize.query('ALTER TABLE prescription_items ADD COLUMN time_to_take TIME;');
    console.log('Successfully added time_to_take column to prescription_items.');
  } catch (err) {
    if (err.message.includes('Duplicate column name')) {
      console.log('Column already exists.');
    } else {
      console.error('Error altering table:', err);
    }
  } finally {
    process.exit(0);
  }
}

alterDb();
