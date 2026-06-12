const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Bill extends Model {}

Bill.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    admission_id: { type: DataTypes.INTEGER, allowNull: true },
    total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    status: {
      type: DataTypes.ENUM('unpaid', 'partial', 'paid', 'cancelled'),
      allowNull: false,
      defaultValue: 'unpaid',
    },
    payment_date: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Bill',
    tableName: 'bills',
    indexes: [
      { fields: ['patient_id'] },
      { fields: ['admission_id'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = Bill;
