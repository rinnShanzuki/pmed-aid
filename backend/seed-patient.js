const { User, Patient } = require('./src/models');

async function seed() {
  const email = 'patient@pmed-aid.com';
  const user = await User.findOne({ where: { email } });
  
  if (user) {
    let patient = await Patient.findOne({ where: { user_id: user.id } });
    if (!patient) {
      patient = await Patient.create({
        first_name: 'John',
        last_name: 'Doe',
        contact_number: '555-0199',
        date_of_birth: '1980-05-15',
        gender: 'male',
        address: '123 Health Ave, Wellness City',
        emergency_contact_name: 'Jane Doe',
        emergency_contact_number: '555-0188',
        blood_type: 'O+',
        allergies: 'Penicillin',
        user_id: user.id
      });
      console.log('Created linked Patient record with ID:', patient.id);
    } else {
      console.log('Patient record already exists.');
    }
  }
}

seed().catch(console.error).finally(() => process.exit(0));
