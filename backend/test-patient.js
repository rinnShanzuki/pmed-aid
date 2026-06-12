const { User, Patient } = require('./src/models');
async function test() {
  const users = await User.findAll({ where: { role: 'patient' } });
  console.log('Patient Users:', users.map(u => u.email));
  if (users.length > 0) {
    const p = await Patient.findOne({ where: { user_id: users[0].id } });
    console.log('Linked Patient Record:', p ? p.first_name : 'NONE FOUND!');
  }
}
test().catch(console.error).finally(() => process.exit(0));
