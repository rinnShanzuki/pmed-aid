const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class MedicationLog extends Model {}

MedicationLog.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    schedule_id: { type: DataTypes.INTEGER, allowNull: false },
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    action: {
      type: DataTypes.ENUM('administered', 'missed', 'skipped', 'confirmed'),
      allowNull: false,
    },
    performed_by: { type: DataTypes.INTEGER, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'MedicationLog',
    tableName: 'medication_logs',
    updatedAt: false,
    indexes: [
      { fields: ['schedule_id'] },
      { fields: ['patient_id'] },
      { fields: ['action'] },
    ],
  }
);

module.exports = MedicationLog;
