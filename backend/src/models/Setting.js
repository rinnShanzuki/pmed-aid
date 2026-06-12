const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Setting extends Model {}

Setting.init(
  {
    key: { type: DataTypes.STRING(100), primaryKey: true },
    value: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
    category: { type: DataTypes.STRING(50), allowNull: true, defaultValue: 'general' }
  },
  {
    sequelize,
    modelName: 'Setting',
    tableName: 'settings',
    timestamps: true,
  }
);

module.exports = Setting;
