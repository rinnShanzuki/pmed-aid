const { User } = require('./src/models');
async function test() {
  const user = await User.findByPk(4);
  console.log('Found user:', user.email);
  try {
    await user.update({ is_active: true });
    console.log('Reactivated doctor. is_active:', user.is_active);
  } catch (e) {
    console.error('Update failed:', e);
  }
}
test().catch(console.error).finally(() => process.exit(0));
