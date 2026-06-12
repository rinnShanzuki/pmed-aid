require('dotenv').config();
const { sequelize, User } = require('../models');

async function migrate() {
  console.log('🔄 Starting Sequelize migration...');

  // Sync all models: creates tables if they don't exist, alters if they do
  await sequelize.sync({ alter: true });
  console.log('✅ All tables synced');

  // Seed default admin user if none exists
  const existing = await User.findOne({ where: { email: 'admin@pmed-aid.com' } });
  if (!existing) {
    await User.create({
      email: 'admin@pmed-aid.com',
      password: 'admin123',
      first_name: 'System',
      last_name: 'Administrator',
      role: 'admin',
    });
    console.log('  ✅ Default admin seeded → admin@pmed-aid.com / admin123');
  } else {
    console.log('  ℹ️  Admin user already exists, skipping seed');
  }

  console.log('\n🎉 Migration complete!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  console.error(err);
  process.exit(1);
});
