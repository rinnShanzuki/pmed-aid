const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Room extends Model {}

Room.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    room_number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    room_type: {
      type: DataTypes.ENUM('ward', 'semi_private', 'private', 'icu'),
      allowNull: false,
      defaultValue: 'ward',
    },
    is_occupied: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    price_per_day: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
  },
  {
    sequelize,
    modelName: 'Room',
    tableName: 'rooms',
    indexes: [{ fields: ['is_occupied'] }],
  }
);

module.exports = Room;
