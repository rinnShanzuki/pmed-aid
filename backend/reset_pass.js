const sequelize = require('./src/config/db');
const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

(async () => {
  await sequelize.authenticate();
  const pass = await bcrypt.hash('password123', 10);
  await User.update({ password: pass }, { where: { email: 'nurse@hospital.local' } });
  console.log('Password reset for nurse@hospital.local to password123');
  process.exit(0);
})();
