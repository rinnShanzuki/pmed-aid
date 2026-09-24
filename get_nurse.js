const sequelize = require('./backend/src/config/db');
const { User } = require('./backend/src/models');

(async () => {
  await sequelize.authenticate();
  let nurse = await User.findOne({ where: { role: 'nurse' }});
  if (nurse) console.log(nurse.email);
  process.exit(0);
})();
