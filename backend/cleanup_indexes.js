const sequelize = require('./src/config/db');

async function cleanIndexes() {
  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL');

    const [results] = await sequelize.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = 'pmed_aid' 
        AND TABLE_NAME = 'users' 
        AND INDEX_NAME != 'PRIMARY'
    `);

    const indexNames = [...new Set(results.map(r => r.INDEX_NAME))];
    console.log('Found indexes:', indexNames);

    for (const idx of indexNames) {
      if (idx.startsWith('email') || idx.startsWith('users_email')) {
        console.log('Dropping index:', idx);
        try {
          await sequelize.query(`ALTER TABLE \`users\` DROP INDEX \`${idx}\``);
        } catch (e) {
          console.error(`Failed to drop ${idx}:`, e.message);
        }
      }
    }

    // Recreate a single unique index on email
    try {
      await sequelize.query(`ALTER TABLE \`users\` ADD UNIQUE INDEX \`users_email_unique\` (\`email\`)`);
      console.log('Added single unique index on email.');
    } catch (e) {
      console.log('Index might already exist or error:', e.message);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanIndexes();
