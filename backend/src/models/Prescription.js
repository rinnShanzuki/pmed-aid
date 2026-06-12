const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Prescription extends Model {}

Prescription.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    admission_id: { type: DataTypes.INTEGER, allowNull: false },
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    doctor_id: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.ENUM('in_hospital', 'discharge'),
      allowNull: false,
      defaultValue: 'in_hospital',
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'active',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Prescription',
    tableName: 'prescriptions',
    indexes: [
      { fields: ['patient_id'] },
      { fields: ['admission_id'] },
      { fields: ['status'] },
      { fields: ['type'] },
    ],
  }
);

module.exports = Prescription;
