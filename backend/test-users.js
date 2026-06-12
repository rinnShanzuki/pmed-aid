const { User } = require('./src/models');
async function test() {
  const users = await User.findAll();
  console.log('Users:');
  users.forEach(u => console.log(`ID: ${u.id}, Name: ${u.first_name}, Active: ${u.is_active}`));
}
test().catch(console.error).finally(() => process.exit(0));
