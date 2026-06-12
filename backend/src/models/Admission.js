const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Admission extends Model {}

Admission.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    room_id: { type: DataTypes.INTEGER, allowNull: false },
    admitted_by: { type: DataTypes.INTEGER, allowNull: false },
    attending_doctor_id: { type: DataTypes.INTEGER, allowNull: false },
    admission_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    discharge_date: { type: DataTypes.DATE, allowNull: true },
    diagnosis: { type: DataTypes.TEXT, allowNull: true },
    consultation_notes: { type: DataTypes.TEXT, allowNull: true },
    consultation_status: {
      type: DataTypes.ENUM('not_started', 'in_session', 'completed'),
      allowNull: false,
      defaultValue: 'not_started',
    },
    discharge_requested: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    discharge_requested_by: { type: DataTypes.INTEGER, allowNull: true },
    discharge_requested_at: { type: DataTypes.DATE, allowNull: true },
    discharge_confirmed_by_desk: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    discharge_confirmed_at: { type: DataTypes.DATE, allowNull: true },
    discharge_notes: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('admitted', 'discharged'),
      allowNull: false,
      defaultValue: 'admitted',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Admission',
    tableName: 'admissions',
    indexes: [
      { fields: ['patient_id'] },
      { fields: ['status'] },
      { fields: ['attending_doctor_id'] },
      { fields: ['discharge_requested'] },
    ],
  }
);

module.exports = Admission;
