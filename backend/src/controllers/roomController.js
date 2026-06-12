const { Room } = require('../models');
const { validationResult } = require('express-validator');

exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const existing = await Room.findOne({ where: { room_number: req.body.room_number } });
    if (existing) return res.status(409).json({ success: false, message: 'Room number already exists.' });

    const room = await Room.create(req.body);
    res.status(201).json({ success: true, data: room });
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.room_type) where.room_type = req.query.room_type;
    if (req.query.is_occupied !== undefined) where.is_occupied = req.query.is_occupied === 'true';

    const rooms = await Room.findAll({ where, order: [['room_number', 'ASC']] });
    res.json({ success: true, data: rooms });
  } catch (error) { next(error); }
};

exports.getAvailable = async (req, res, next) => {
  try {
    const rooms = await Room.findAll({
      where: { is_occupied: false },
      order: [['room_type', 'ASC'], ['room_number', 'ASC']],
    });
    res.json({ success: true, data: rooms });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
    res.json({ success: true, data: room });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });

    await room.update(req.body);
    res.json({ success: true, data: room });
  } catch (error) { next(error); }
};
