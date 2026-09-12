/**
 * Cleanup script: Remove all patient records and associated data
 * EXCEPT the patient linked to user patient@hospital.local
 */
require('dotenv').config();
const sequelize = require('./src/config/db');

async function cleanup() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.\n');

    // 1. Find the patient user
    const [users] = await sequelize.query(
      `SELECT id FROM users WHERE email = 'patient@hospital.local' LIMIT 1`
    );
    if (users.length === 0) {
      console.log('No user found with email patient@hospital.local');
      process.exit(1);
    }
    const keepUserId = users[0].id;

    // 2. Find the patient record linked to that user
    const [patients] = await sequelize.query(
      `SELECT id FROM patients WHERE user_id = ${keepUserId} LIMIT 1`
    );
    const keepPatientId = patients.length > 0 ? patients[0].id : null;

    console.log(`Keeping user_id=${keepUserId}, patient_id=${keepPatientId}\n`);

    // Disable foreign key checks for clean deletion
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // 3. Delete associated records for ALL patients except the kept one
    const condition = keepPatientId
      ? `WHERE patient_id != ${keepPatientId}`
      : '';

    const tables = [
      'medication_logs',
      'medication_schedules',
      'prescription_items',
      'qr_codes',
      'prescriptions',
      'bills',
      'bill_items',
      'consultations',
      'admissions',
      'notifications',
    ];

    for (const table of tables) {
      try {
        // Check if table exists first
        const [rows] = await sequelize.query(
          `SELECT COUNT(*) as cnt FROM ${table} ${condition}`
        );
        const count = rows[0].cnt;
        if (count > 0) {
          await sequelize.query(`DELETE FROM ${table} ${condition}`);
          console.log(`  ✓ Deleted ${count} rows from ${table}`);
        } else {
          console.log(`  - ${table}: nothing to delete`);
        }
      } catch (err) {
        // Table might not exist or column might not exist
        console.log(`  ⚠ Skipped ${table}: ${err.message.split('\n')[0]}`);
      }
    }

    // 4. Delete bill_items that reference deleted bills (if bill_id based)
    try {
      await sequelize.query(
        `DELETE FROM bill_items WHERE bill_id NOT IN (SELECT id FROM bills)`
      );
      console.log('  ✓ Cleaned orphaned bill_items');
    } catch (err) {
      console.log(`  ⚠ bill_items cleanup: ${err.message.split('\n')[0]}`);
    }

    // 5. Delete prescription_items that reference deleted prescriptions
    try {
      await sequelize.query(
        `DELETE FROM prescription_items WHERE prescription_id NOT IN (SELECT id FROM prescriptions)`
      );
      console.log('  ✓ Cleaned orphaned prescription_items');
    } catch (err) {
      console.log(`  ⚠ prescription_items cleanup: ${err.message.split('\n')[0]}`);
    }

    // 6. Delete the patient records themselves
    const patientCondition = keepPatientId
      ? `WHERE id != ${keepPatientId}`
      : '';
    const [patientRows] = await sequelize.query(
      `SELECT COUNT(*) as cnt FROM patients ${patientCondition}`
    );
    if (patientRows[0].cnt > 0) {
      await sequelize.query(`DELETE FROM patients ${patientCondition}`);
      console.log(`  ✓ Deleted ${patientRows[0].cnt} patient records`);
    }

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // 7. Reset room occupancy for rooms that no longer have admitted patients
    try {
      await sequelize.query(
        `UPDATE rooms SET current_occupancy = (
          SELECT COUNT(*) FROM admissions 
          WHERE admissions.room_id = rooms.id AND admissions.status = 'admitted'
        )`
      );
      console.log('  ✓ Reset room occupancy counts');
    } catch (err) {
      console.log(`  ⚠ Room reset: ${err.message.split('\n')[0]}`);
    }

    console.log('\n✅ Cleanup complete! Only patient@hospital.local data remains.');
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
}

cleanup();
