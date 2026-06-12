const { User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

exports.getAll = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.role) where.role = req.query.role;
    if (req.query.is_active !== undefined) where.is_active = req.query.is_active === 'true';
    if (req.query.search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${req.query.search}%` } },
        { last_name: { [Op.like]: `%${req.query.search}%` } },
        { email: { [Op.like]: `%${req.query.search}%` } },
      ];
    }

    const users = await User.findAll({ where, order: [['created_at', 'DESC']] });
    res.json({ success: true, data: users });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

exports.createUser = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use.' });

    const user = await User.create({ first_name, last_name, email, password, role });
    res.status(201).json({ success: true, data: user });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { first_name, last_name, email, role, is_active } = req.body;
    await user.update({ first_name, last_name, email, role, is_active });

    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

exports.delete = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await user.update({ is_active: false });
    res.json({ success: true, message: 'User deactivated.', data: user });
  } catch (error) { next(error); }
};
