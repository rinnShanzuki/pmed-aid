require('dotenv').config();
const { sequelize, User } = require('./src/models');

async function seedTestAccounts() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    const testAccounts = [
      {
        email: 'admin@hospital.local',
        password: 'admin123',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      },
      {
        email: 'infodesk@hospital.local',
        password: 'infodesk123',
        first_name: 'Rinn',
        last_name: 'Espinosa',
        role: 'info_desk'
      },
      {
        email: 'fajuziajesssan@gmail.com',
        password: 'YRU8HA_E13A22A',
        first_name: 'Info',
        last_name: 'Desk',
        role: 'info_desk'
      },
      {
        email: 'doctor@hospital.local',
        password: 'doctor123',
        first_name: 'Dr. Ruiz',
        last_name: 'Cruz',
        role: 'doctor'
      },
      {
        email: 'nurse@hospital.local',
        password: 'nurse123',
        first_name: 'Maria',
        last_name: 'Santos',
        role: 'nurse'
      },
      {
        email: 'patient@test.com',
        password: 'patient123',
        first_name: 'John',
        last_name: 'Doe',
        role: 'patient'
      }
    ];

    // Create all test accounts
    for (const account of testAccounts) {
      await User.findOrCreate({
        where: { email: account.email },
        defaults: {
          ...account,
          is_active: true
        }
      });
    }

    console.log(`✓ Created ${testAccounts.length} test accounts\n`);

    console.log('='.repeat(60));
    console.log('✅ TEST ACCOUNTS CREATED');
    console.log('='.repeat(60));
    console.log('\n📋 LOGIN CREDENTIALS:\n');
    console.log('🔐 ADMIN:');
    console.log('   Email: admin@hospital.local');
    console.log('   Password: admin123\n');
    console.log('🗂️  INFO DESK:');
    console.log('   Email: infodesk@hospital.local');
    console.log('   Password: infodesk123\n');
    console.log('👨‍⚕️  DOCTOR:');
    console.log('   Email: doctor@hospital.local');
    console.log('   Password: doctor123\n');
    console.log('💉 NURSE:');
    console.log('   Email: nurse@hospital.local');
    console.log('   Password: nurse123\n');
    console.log('👤 PATIENT:');
    console.log('   Email: patient@test.com');
    console.log('   Password: patient123\n');
    console.log('='.repeat(60));
    console.log('\n🌐 Login at: http://localhost:5173/login\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedTestAccounts();
