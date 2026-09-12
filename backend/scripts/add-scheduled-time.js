const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

async function addScheduledTime() {
  try {
    await sequelize.authenticate();
    console.log('Connected to the database.');
    
    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_name = 'consultations'
      AND table_schema = '${process.env.DB_NAME}'
      AND column_name = 'scheduled_time'
    `);
    
    if (results[0].count === 0) {
      await sequelize.query('ALTER TABLE consultations ADD COLUMN scheduled_time DATETIME NULL;');
      console.log('Successfully added scheduled_time column to consultations table.');
    } else {
      console.log('Column scheduled_time already exists.');
    }
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    await sequelize.close();
  }
}

addScheduledTime();
