const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Consultation extends Model {}

Consultation.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    doctor_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('waiting', 'in_session', 'completed', 'admitted'),
      allowNull: false,
      defaultValue: 'waiting',
    },
    admission_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    admission_id: { type: DataTypes.INTEGER, allowNull: true },
    department: { type: DataTypes.STRING(255), allowNull: true },
    diagnosis: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    doctor_notes: { type: DataTypes.TEXT, allowNull: true },
    chief_complaint: { type: DataTypes.TEXT, allowNull: true },
    hpi: { type: DataTypes.TEXT, allowNull: true },
    symptoms: { type: DataTypes.TEXT, allowNull: true },
    findings: { type: DataTypes.TEXT, allowNull: true },
    vital_signs: { type: DataTypes.JSON, allowNull: true },
    assessment: { type: DataTypes.TEXT, allowNull: true },
    follow_up_date: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Consultation',
    tableName: 'consultations',
    indexes: [
      { fields: ['patient_id'] },
      { fields: ['doctor_id'] },
      { fields: ['status'] },
      { fields: ['admission_required'] },
      { fields: ['admission_id'] },
    ],
  }
);

module.exports = Consultation;
