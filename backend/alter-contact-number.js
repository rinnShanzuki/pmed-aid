require('dotenv').config();
const sequelize = require('./src/config/db');

async function updateContactNumber() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.\n');

    // Alter the contact_number column in patients table to allow NULL
    await sequelize.query('ALTER TABLE patients MODIFY COLUMN contact_number VARCHAR(20) NULL;');
    console.log('Successfully altered patients table: contact_number is now optional.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to update table:', error);
    process.exit(1);
  }
}

updateContactNumber();
