const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class QrCode extends Model {}

QrCode.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    admission_id: { type: DataTypes.INTEGER, allowNull: false },
    prescription_id: { type: DataTypes.INTEGER, allowNull: true },
    code: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      defaultValue: () => `PMED-${uuidv4()}`
    },
    type: { type: DataTypes.ENUM('in_hospital', 'discharge'), allowNull: false },
    status: { type: DataTypes.ENUM('active', 'bound', 'inactive'), allowNull: false, defaultValue: 'active' },
    bound_user_id: { type: DataTypes.INTEGER, allowNull: true },
    bound_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'QrCode',
    tableName: 'qr_codes',
    hooks: {
      beforeCreate: (qr) => {
        if (!qr.code) {
          qr.code = `PMED-${uuidv4()}`;
        }
      },
    },
    indexes: [
      { fields: ['code'] },
      { fields: ['patient_id'] },
      { fields: ['prescription_id'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = QrCode;
