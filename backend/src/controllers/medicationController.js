const { Medication } = require('../models');

exports.getAll = async (req, res, next) => {
  try {
    const medications = await Medication.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: medications });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const medication = await Medication.findByPk(req.params.id);
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found.' });
    res.json({ success: true, data: medication });
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, generic_name, category, stock, status, description } = req.body;
    const medication = await Medication.create({ name, generic_name, category, stock, status, description });
    res.status(201).json({ success: true, data: medication });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const medication = await Medication.findByPk(req.params.id);
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found.' });
    
    await medication.update(req.body);
    res.json({ success: true, data: medication });
  } catch (error) { next(error); }
};

exports.delete = async (req, res, next) => {
  try {
    const medication = await Medication.findByPk(req.params.id);
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found.' });
    
    await medication.update({ status: 'inactive' });
    res.json({ success: true, message: 'Medication deactivated.', data: medication });
  } catch (error) { next(error); }
};
