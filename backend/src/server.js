require('dotenv').config();
const app = require('./app');
const { sequelize, User } = require('./models');

const PORT = process.env.PORT || 5000;

async function ensureDefaultAccounts() {
  try {
    const testAccounts = [
      { email: 'admin@hospital.local', password: 'admin123', first_name: 'Admin', last_name: 'User', role: 'admin' },
      { email: 'infodesk@hospital.local', password: 'infodesk123', first_name: 'Rinn', last_name: 'Espinosa', role: 'info_desk' },
      { email: 'doctor@hospital.local', password: 'doctor123', first_name: 'Dr. Ruiz', last_name: 'Cruz', role: 'doctor' },
      { email: 'nurse@hospital.local', password: 'nurse123', first_name: 'Maria', last_name: 'Santos', role: 'nurse' },
      { email: 'patient@test.com', password: 'patient123', first_name: 'John', last_name: 'Doe', role: 'patient' }
    ];

    for (const account of testAccounts) {
      const existing = await User.scope('withPassword').findOne({ where: { email: account.email } });
      if (!existing) {
        await User.create({ ...account, is_active: true });
        console.log(`✅ Auto-created account: ${account.email}`);
      } else {
        const isMatch = await existing.comparePassword(account.password);
        if (!isMatch || !existing.is_active) {
          existing.password = account.password;
          existing.is_active = true;
          await existing.save();
          console.log(`✅ Auto-synced credentials for: ${account.email}`);
        }
      }
    }
  } catch (err) {
    console.error('⚠️ Could not verify default accounts:', err.message);
  }
}

function startServer() {
  // Start HTTP server immediately so cloud health checks pass and port opens without blocking on DB
  app.listen(PORT, () => {
    console.log(`🚀 Server running → http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Initialize DB and background tasks asynchronously
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('✅ MySQL database connected');

      await sequelize.sync();
      console.log('✅ Database models synced');

      await ensureDefaultAccounts();
    } catch (error) {
      console.error('❌ Database initialization warning:', error.message);
    }
  })();
}

startServer();
