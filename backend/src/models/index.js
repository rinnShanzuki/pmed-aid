/**
 * Sequelize Models Index
 * Central hub that imports all models, defines associations,
 * and exports them together with the sequelize instance.
 */
const sequelize = require('../config/db');

// Import all models
const User = require('./User');
const Patient = require('./Patient');
const Room = require('./Room');
const Admission = require('./Admission');
const Prescription = require('./Prescription');
const PrescriptionItem = require('./PrescriptionItem');
const MedicationSchedule = require('./MedicationSchedule');
const MedicationLog = require('./MedicationLog');
const QrCode = require('./QrCode');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');
const Medication = require('./Medication');
const Setting = require('./Setting');
const Bill = require('./Bill');
const BillItem = require('./BillItem');

// ─── Associations ──────────────────────────────────────────────────────────

// User ↔ Patient
User.hasOne(Patient, { foreignKey: 'user_id', as: 'patientProfile', onDelete: 'SET NULL' });
Patient.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Patient ↔ Admission
Patient.hasMany(Admission, { foreignKey: 'patient_id', as: 'admissions', onDelete: 'CASCADE' });
Admission.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// Room ↔ Admission
Room.hasMany(Admission, { foreignKey: 'room_id', as: 'admissions' });
Admission.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

// User (info_desk) ↔ Admission.admitted_by
User.hasMany(Admission, { foreignKey: 'admitted_by', as: 'admittedAdmissions' });
Admission.belongsTo(User, { foreignKey: 'admitted_by', as: 'admittedBy' });

// User (doctor) ↔ Admission.attending_doctor_id
User.hasMany(Admission, { foreignKey: 'attending_doctor_id', as: 'doctorAdmissions' });
Admission.belongsTo(User, { foreignKey: 'attending_doctor_id', as: 'doctor' });

// User (nurse) ↔ Admission.assigned_nurse_id
User.hasMany(Admission, { foreignKey: 'assigned_nurse_id', as: 'assignedAdmissions' });
Admission.belongsTo(User, { foreignKey: 'assigned_nurse_id', as: 'assignedNurse' });

// User (doctor) -> Admission.discharge_requested_by
User.hasMany(Admission, { foreignKey: 'discharge_requested_by', as: 'requestedDischarges' });
Admission.belongsTo(User, { foreignKey: 'discharge_requested_by', as: 'dischargeRequestedBy' });

// Admission ↔ Prescription
Admission.hasMany(Prescription, { foreignKey: 'admission_id', as: 'prescriptions', onDelete: 'CASCADE' });
Prescription.belongsTo(Admission, { foreignKey: 'admission_id', as: 'admission' });

// Patient ↔ Prescription
Patient.hasMany(Prescription, { foreignKey: 'patient_id', as: 'prescriptions', onDelete: 'CASCADE' });
Prescription.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// User (doctor) ↔ Prescription
User.hasMany(Prescription, { foreignKey: 'doctor_id', as: 'prescriptions' });
Prescription.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });

// Prescription ↔ PrescriptionItem
Prescription.hasMany(PrescriptionItem, { foreignKey: 'prescription_id', as: 'items', onDelete: 'CASCADE' });
PrescriptionItem.belongsTo(Prescription, { foreignKey: 'prescription_id', as: 'prescription' });

// PrescriptionItem ↔ MedicationSchedule
PrescriptionItem.hasMany(MedicationSchedule, { foreignKey: 'prescription_item_id', as: 'schedules', onDelete: 'CASCADE' });
MedicationSchedule.belongsTo(PrescriptionItem, { foreignKey: 'prescription_item_id', as: 'prescriptionItem' });

// Prescription ↔ MedicationSchedule
Prescription.hasMany(MedicationSchedule, { foreignKey: 'prescription_id', as: 'schedules', onDelete: 'CASCADE' });
MedicationSchedule.belongsTo(Prescription, { foreignKey: 'prescription_id', as: 'prescription' });

// Admission ↔ MedicationSchedule
Admission.hasMany(MedicationSchedule, { foreignKey: 'admission_id', as: 'schedules', onDelete: 'CASCADE' });
MedicationSchedule.belongsTo(Admission, { foreignKey: 'admission_id', as: 'admission' });

// Patient ↔ MedicationSchedule
Patient.hasMany(MedicationSchedule, { foreignKey: 'patient_id', as: 'schedules', onDelete: 'CASCADE' });
MedicationSchedule.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// User (nurse) ↔ MedicationSchedule.administered_by
User.hasMany(MedicationSchedule, { foreignKey: 'administered_by', as: 'administeredSchedules' });
MedicationSchedule.belongsTo(User, { foreignKey: 'administered_by', as: 'administeredBy' });

// MedicationSchedule ↔ MedicationLog
MedicationSchedule.hasMany(MedicationLog, { foreignKey: 'schedule_id', as: 'logs', onDelete: 'CASCADE' });
MedicationLog.belongsTo(MedicationSchedule, { foreignKey: 'schedule_id', as: 'schedule' });

// Patient ↔ MedicationLog
Patient.hasMany(MedicationLog, { foreignKey: 'patient_id', as: 'medicationLogs', onDelete: 'CASCADE' });
MedicationLog.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// User ↔ MedicationLog.performed_by
User.hasMany(MedicationLog, { foreignKey: 'performed_by', as: 'medicationActions' });
MedicationLog.belongsTo(User, { foreignKey: 'performed_by', as: 'performedBy' });

// Patient ↔ QrCode
Patient.hasMany(QrCode, { foreignKey: 'patient_id', as: 'qrCodes', onDelete: 'CASCADE' });
QrCode.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// Admission ↔ QrCode
Admission.hasMany(QrCode, { foreignKey: 'admission_id', as: 'qrCodes', onDelete: 'CASCADE' });
QrCode.belongsTo(Admission, { foreignKey: 'admission_id', as: 'admission' });

// Prescription -> QR Code
Prescription.hasMany(QrCode, { foreignKey: 'prescription_id', as: 'qrCodes', onDelete: 'SET NULL' });
QrCode.belongsTo(Prescription, { foreignKey: 'prescription_id', as: 'prescription' });

// User ↔ QrCode.bound_user_id
User.hasMany(QrCode, { foreignKey: 'bound_user_id', as: 'boundQrCodes' });
QrCode.belongsTo(User, { foreignKey: 'bound_user_id', as: 'boundUser' });

// User ↔ Notification
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// MedicationSchedule ↔ Notification
MedicationSchedule.hasMany(Notification, { foreignKey: 'related_schedule_id', as: 'notifications' });
Notification.belongsTo(MedicationSchedule, { foreignKey: 'related_schedule_id', as: 'relatedSchedule' });

Prescription.hasMany(Notification, { foreignKey: 'related_prescription_id', as: 'notifications' });
Notification.belongsTo(Prescription, { foreignKey: 'related_prescription_id', as: 'relatedPrescription' });

Admission.hasMany(Notification, { foreignKey: 'related_admission_id', as: 'notifications' });
Notification.belongsTo(Admission, { foreignKey: 'related_admission_id', as: 'relatedAdmission' });

// User ↔ AuditLog
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs', onDelete: 'CASCADE' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Bill ↔ BillItem
Bill.hasMany(BillItem, { foreignKey: 'bill_id', as: 'items', onDelete: 'CASCADE' });
BillItem.belongsTo(Bill, { foreignKey: 'bill_id', as: 'bill' });

// Patient ↔ Bill
Patient.hasMany(Bill, { foreignKey: 'patient_id', as: 'bills', onDelete: 'CASCADE' });
Bill.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// Admission ↔ Bill
Admission.hasMany(Bill, { foreignKey: 'admission_id', as: 'bills', onDelete: 'CASCADE' });
Bill.belongsTo(Admission, { foreignKey: 'admission_id', as: 'admission' });

// ─── Exports ──────────────────────────────────────────────────────────────
module.exports = {
  sequelize,
  User,
  Patient,
  Room,
  Admission,
  Prescription,
  PrescriptionItem,
  MedicationSchedule,
  MedicationLog,
  QrCode,
  Notification,
  AuditLog,
  Medication,
  Setting,
  Bill,
  BillItem,
};
