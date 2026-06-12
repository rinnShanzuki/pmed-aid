const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class PrescriptionItem extends Model {}

PrescriptionItem.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    prescription_id: { type: DataTypes.INTEGER, allowNull: false },
    medication_name: { type: DataTypes.STRING(255), allowNull: false },
    dosage: { type: DataTypes.STRING(100), allowNull: false },
    dosage_unit: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'mg' },
    frequency: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    frequency_unit: {
      type: DataTypes.ENUM('hourly', 'daily', 'weekly'),
      allowNull: false,
      defaultValue: 'daily',
    },
    duration: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    duration_unit: {
      type: DataTypes.ENUM('days', 'weeks', 'months'),
      allowNull: false,
      defaultValue: 'days',
    },
    route: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'oral' },
    instructions: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'PrescriptionItem',
    tableName: 'prescription_items',
    indexes: [{ fields: ['prescription_id'] }],
  }
);

module.exports = PrescriptionItem;
