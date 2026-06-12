const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Patient extends Model {}

Patient.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    first_name: { type: DataTypes.STRING(100), allowNull: false },
    last_name: { type: DataTypes.STRING(100), allowNull: false },
    date_of_birth: { type: DataTypes.DATEONLY, allowNull: false },
    gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: false },
    contact_number: { type: DataTypes.STRING(20), allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: true },
    emergency_contact_name: { type: DataTypes.STRING(200), allowNull: true },
    emergency_contact_number: { type: DataTypes.STRING(20), allowNull: true },
    blood_type: { type: DataTypes.STRING(5), allowNull: true },
    allergies: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Patient',
    tableName: 'patients',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['last_name', 'first_name'] },
    ],
  }
);

module.exports = Patient;
