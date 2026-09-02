const { sequelize } = require('./src/models');

async function alterDb() {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully!');
  } catch (error) {
    console.error('Failed to sync DB:', error);
  } finally {
    process.exit();
  }
}

alterDb();
