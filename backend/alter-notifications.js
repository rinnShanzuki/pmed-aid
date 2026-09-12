require('dotenv').config();
const mysql = require('mysql2/promise');

async function alterNotifications() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pmed_aid'
    });

    console.log('Adding related_consultation_id to notifications table...');
    await connection.execute(`ALTER TABLE notifications ADD COLUMN related_consultation_id INT NULL`);
    console.log('✅ Column added successfully!');

    await connection.end();
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
      process.exit(0);
    }
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

alterNotifications();
