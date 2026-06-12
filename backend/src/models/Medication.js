const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Medication extends Model {}

Medication.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    generic_name: { type: DataTypes.STRING(255), allowNull: true },
    category: { type: DataTypes.STRING(100), allowNull: true },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'out_of_stock'),
      allowNull: false,
      defaultValue: 'active',
    },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Medication',
    tableName: 'medications',
    indexes: [
      { fields: ['name'] },
      { fields: ['status'] }
    ],
  }
);

module.exports = Medication;
