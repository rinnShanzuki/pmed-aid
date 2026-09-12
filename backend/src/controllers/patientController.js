const { Patient, User, AuditLog, Consultation, Admission, Prescription } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

exports.getMe = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    res.json({ success: true, data: patient });
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const patient = await Patient.create(req.body);

    await AuditLog.create({
      user_id: req.user.id,
      action: 'patient_registered',
      entity_type: 'patient',
      entity_id: patient.id,
      details: { first_name: patient.first_name, last_name: patient.last_name },
      ip_address: req.ip,
    });

    res.status(201).json({ success: true, data: patient });
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${req.query.search}%` } },
        { last_name: { [Op.like]: `%${req.query.search}%` } },
      ];
    }

    if (req.query.exclude_active === 'true') {
      const activeConsults = await Consultation.findAll({
        where: { status: { [Op.in]: ['waiting', 'in-progress'] } },
        attributes: ['patient_id']
      });
      const activeAdmits = await Admission.findAll({
        where: { status: 'admitted' },
        attributes: ['patient_id']
      });
      const excludeIds = new Set([
        ...activeConsults.map(c => c.patient_id),
        ...activeAdmits.map(a => a.patient_id)
      ]);
      if (excludeIds.size > 0) {
        where.id = { ...where.id, [Op.notIn]: Array.from(excludeIds) };
      }
    }

    if (req.user && req.user.role === 'doctor') {
      const [consults, admits, prescs] = await Promise.all([
        Consultation.findAll({ where: { doctor_id: req.user.id }, attributes: ['patient_id'] }),
        Admission.findAll({ where: { attending_doctor_id: req.user.id }, attributes: ['patient_id'] }),
        Prescription.findAll({ where: { doctor_id: req.user.id }, attributes: ['patient_id'] })
      ]);
      const patientIds = new Set([
        ...consults.map(c => c.patient_id),
        ...admits.map(a => a.patient_id),
        ...prescs.map(p => p.patient_id)
      ]);
      where.id = { [Op.in]: Array.from(patientIds) };
    }

    const patients = await Patient.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['email'] }],
      order: [['last_name', 'ASC'], ['first_name', 'ASC']],
    });
    res.json({ success: true, data: patients });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const patient = await Patient.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['email', 'role'] }],
    });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
    res.json({ success: true, data: patient });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    await patient.update(req.body);
    res.json({ success: true, data: patient });
  } catch (error) { next(error); }
};
