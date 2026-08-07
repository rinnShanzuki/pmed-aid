const sequelize = require('./src/config/db');

async function alterDb() {
  try {
    await sequelize.query('ALTER TABLE prescriptions ADD COLUMN prescribed_time TIME;');
    console.log('Successfully added prescribed_time column.');
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
