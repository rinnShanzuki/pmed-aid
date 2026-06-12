require('dotenv').config();
const mysql = require('mysql2/promise');

async function resetDatabase() {
  let connection;
  try {
    console.log('Connecting to MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      waitForConnections: true,
    });

    const dbName = process.env.DB_NAME || 'pmed_aid';

    console.log(`⚠️  Dropping database "${dbName}"...`);
    try {
      await connection.execute(`DROP DATABASE IF EXISTS \`${dbName}\``);
      console.log('✓ Database dropped');
    } catch (err) {
      console.log('✓ Database did not exist (that\'s OK)');
    }

    console.log(`✅ Creating fresh database "${dbName}"...`);
    await connection.execute(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✓ Database created');

    await connection.end();

    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE RESET COMPLETE');
    console.log('='.repeat(50));
    console.log('\nNow restart your backend server:');
    console.log('  cd backend && npm run dev\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

resetDatabase();
