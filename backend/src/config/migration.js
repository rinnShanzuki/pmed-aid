require('dotenv').config();
const { sequelize, User, Room } = require('../models');

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

  // Seed default rooms if none exist
  const roomCount = await Room.count();
  if (roomCount === 0) {
    const rooms = [
      { room_number: '101A', room_type: 'ward', price_per_day: 50.00 },
      { room_number: '101B', room_type: 'ward', price_per_day: 50.00 },
      { room_number: '201', room_type: 'semi_private', price_per_day: 150.00 },
      { room_number: '202', room_type: 'semi_private', price_per_day: 150.00 },
      { room_number: '301', room_type: 'private', price_per_day: 300.00 },
      { room_number: 'ICU-1', room_type: 'icu', price_per_day: 800.00 },
    ];
    await Room.bulkCreate(rooms);
    console.log('  ✅ Default rooms seeded');
  } else {
    console.log('  ℹ️  Rooms already exist, skipping seed');
  }

  console.log('\n🎉 Migration complete!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  console.error(err);
  process.exit(1);
});
