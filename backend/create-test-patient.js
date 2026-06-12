require('dotenv').config();
const { sequelize, User, Patient } = require('./src/models');

async function createTestPatient() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // Create or update test user
    const [user, created] = await User.findOrCreate({
      where: { email: 'patient@test.com' },
      defaults: {
        email: 'patient@test.com',
        password: 'patient123',  // Use 'password' field (will be auto-hashed)
        first_name: 'John',
        last_name: 'Doe',
        role: 'patient',
        is_active: true
      }
    });

    if (created) {
      console.log('✓ User created:', user.email);
    } else {
      // Update password if user already exists
      await user.update({ password: 'patient123' });
      console.log('✓ User found and password updated:', user.email);
    }

    // Create patient profile
    const [patient, patientCreated] = await Patient.findOrCreate({
      where: { user_id: user.id },
      defaults: {
        user_id: user.id,
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-15',
        gender: 'male',
        contact_number: '555-1234',
        address: '123 Main St'
      }
    });

    if (patientCreated) {
      console.log('✓ Patient profile created');
    } else {
      console.log('✓ Patient profile exists');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ TEST PATIENT ACCOUNT READY');
    console.log('='.repeat(50));
    console.log('\n📧 Email:    patient@test.com');
    console.log('🔑 Password: patient123');
    console.log('\n🌐 Login at: http://localhost:5173/login');
    console.log('📱 Portal at: http://localhost:5173/patient');
    console.log('\n' + '='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createTestPatient();
