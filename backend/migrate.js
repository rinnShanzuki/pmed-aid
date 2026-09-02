const sequelize = require('./src/config/db');

async function migrate() {
  try {
    console.log('Adding civil_status to patients...');
    await sequelize.query("ALTER TABLE patients ADD COLUMN civil_status ENUM('single', 'married', 'divorced', 'widowed') DEFAULT NULL;").catch(e => console.log('Already exists or error:', e.message));
    
    console.log('Adding last_login to users...');
    await sequelize.query("ALTER TABLE users ADD COLUMN last_login DATETIME DEFAULT NULL;").catch(e => console.log('Already exists or error:', e.message));

    console.log('Migration completed.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
