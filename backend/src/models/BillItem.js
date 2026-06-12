const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class BillItem extends Model {}

BillItem.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bill_id: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: false },
    item_type: {
      type: DataTypes.ENUM('room_charge', 'medication', 'procedure', 'other'),
      allowNull: false,
    },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  {
    sequelize,
    modelName: 'BillItem',
    tableName: 'bill_items',
    indexes: [{ fields: ['bill_id'] }],
  }
);

module.exports = BillItem;
