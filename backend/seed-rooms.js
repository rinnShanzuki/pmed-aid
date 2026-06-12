require('dotenv').config();
const { sequelize, Room } = require('./src/models');

async function seedRooms() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    const fakeRooms = [
      // ICU Rooms
      { room_number: '101', room_type: 'icu', is_occupied: false, price_per_day: 500.00 },
      { room_number: '102', room_type: 'icu', is_occupied: false, price_per_day: 500.00 },
      { room_number: '103', room_type: 'icu', is_occupied: false, price_per_day: 500.00 },

      // Ward Rooms
      { room_number: '201', room_type: 'ward', is_occupied: false, price_per_day: 100.00 },
      { room_number: '202', room_type: 'ward', is_occupied: false, price_per_day: 100.00 },
      { room_number: '203', room_type: 'ward', is_occupied: false, price_per_day: 100.00 },
      { room_number: '204', room_type: 'ward', is_occupied: false, price_per_day: 100.00 },
      { room_number: '205', room_type: 'ward', is_occupied: false, price_per_day: 100.00 },
      { room_number: '206', room_type: 'ward', is_occupied: false, price_per_day: 100.00 },

      // Semi-Private Rooms
      { room_number: '301', room_type: 'semi_private', is_occupied: false, price_per_day: 250.00 },
      { room_number: '302', room_type: 'semi_private', is_occupied: false, price_per_day: 250.00 },
      { room_number: '303', room_type: 'semi_private', is_occupied: false, price_per_day: 250.00 },
      { room_number: '304', room_type: 'semi_private', is_occupied: false, price_per_day: 250.00 },

      // Private Rooms
      { room_number: '401', room_type: 'private', is_occupied: false, price_per_day: 400.00 },
      { room_number: '402', room_type: 'private', is_occupied: false, price_per_day: 400.00 },
      { room_number: '403', room_type: 'private', is_occupied: false, price_per_day: 400.00 },
      { room_number: '404', room_type: 'private', is_occupied: false, price_per_day: 400.00 },
      { room_number: '405', room_type: 'private', is_occupied: false, price_per_day: 400.00 },
    ];

    // Delete existing rooms first
    await Room.destroy({ where: {} });
    console.log('✓ Cleared existing rooms');

    // Bulk create rooms
    const created = await Room.bulkCreate(fakeRooms);
    console.log(`✓ Created ${created.length} rooms\n`);

    console.log('='.repeat(50));
    console.log('✅ FAKE ROOMS SEEDED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log('\nRoom Summary:');
    console.log('  🏥 ICU Rooms (101-103): 3 rooms @ $500/day');
    console.log('  🛏️  Ward Rooms (201-206): 6 rooms @ $100/day');
    console.log('  🏠 Semi-Private (301-304): 4 rooms @ $250/day');
    console.log('  👑 Private Rooms (401-405): 5 rooms @ $400/day');
    console.log('\n📊 Total: 18 rooms available for admission');
    console.log('='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedRooms();
