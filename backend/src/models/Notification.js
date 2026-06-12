const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Notification extends Model {}

Notification.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.ENUM('missed_dose', 'overdue', 'reminder', 'alert', 'system'),
      allowNull: false,
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium',
    },
    is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    related_schedule_id: { type: DataTypes.INTEGER, allowNull: true },
    related_prescription_id: { type: DataTypes.INTEGER, allowNull: true },
    related_admission_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['is_read'] },
      { fields: ['user_id', 'is_read'] },
      { fields: ['related_prescription_id'] },
      { fields: ['related_admission_id'] },
    ],
  }
);

module.exports = Notification;
