require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Authenticate DB connection
    await sequelize.authenticate();
    console.log('✅ MySQL database connected');

    // Sync models (creates/updates tables clean and ready)
    await sequelize.sync();
    console.log('✅ Database models synced');

    app.listen(PORT, () => {
      console.log(`🚀 Server running → http://localhost:${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
