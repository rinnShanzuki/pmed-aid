const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class MedicationSchedule extends Model {}

MedicationSchedule.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    prescription_item_id: { type: DataTypes.INTEGER, allowNull: false },
    prescription_id: { type: DataTypes.INTEGER, allowNull: false },
    admission_id: { type: DataTypes.INTEGER, allowNull: false },
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    scheduled_time: { type: DataTypes.DATE, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'missed', 'skipped'),
      allowNull: false,
      defaultValue: 'pending',
    },
    administered_by: { type: DataTypes.INTEGER, allowNull: true },
    administered_at: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'MedicationSchedule',
    tableName: 'medication_schedules',
    indexes: [
      { fields: ['patient_id'] },
      { fields: ['status'] },
      { fields: ['scheduled_time'] },
      { fields: ['patient_id', 'status'] },
      { fields: ['admission_id'] },
    ],
  }
);

module.exports = MedicationSchedule;
