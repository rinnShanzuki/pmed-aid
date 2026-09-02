const { Medication, Prescription, PrescriptionItem, Patient, User, AuditLog } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

// ─── Get all medications (inventory list) ────────────────────────────────
exports.getInventory = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${req.query.search}%` } },
        { generic_name: { [Op.like]: `%${req.query.search}%` } },
        { category: { [Op.like]: `%${req.query.search}%` } },
      ];
    }

    const medications = await Medication.findAll({
      where,
      order: [['name', 'ASC']],
    });

    // Summary stats
    const totalItems = medications.length;
    const totalStock = medications.reduce((sum, m) => sum + m.stock, 0);
    const outOfStock = medications.filter(m => m.stock === 0 || m.status === 'out_of_stock').length;
    const lowStock = medications.filter(m => m.stock > 0 && m.stock <= 10).length;

    res.json({
      success: true,
      data: {
        medications,
        summary: { totalItems, totalStock, outOfStock, lowStock },
      },
    });
  } catch (error) { next(error); }
};

// ─── Get pending pickups (outpatient & discharge prescriptions awaiting dispensing) ──
exports.getPendingPickups = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.findAll({
      where: {
        type: { [Op.in]: ['outpatient', 'discharge'] },
        status: 'active',
      },
      include: [
        {
          model: Patient, as: 'patient',
          attributes: ['id', 'first_name', 'last_name', 'date_of_birth'],
        },
        {
          model: User, as: 'doctor',
          attributes: ['id', 'first_name', 'last_name'],
        },
        {
          model: PrescriptionItem, as: 'items',
          where: { status: 'active' },
          required: false,
          attributes: ['id', 'medication_name', 'dosage', 'dosage_unit', 'frequency', 'frequency_unit', 'duration', 'duration_unit', 'route', 'instructions'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Filter to only prescriptions that have at least 1 active item
    const pending = prescriptions.filter(p => p.items && p.items.length > 0);

    res.json({ success: true, data: pending });
  } catch (error) { next(error); }
};

// ─── Dispense medication (deduct stock) ──────────────────────────────────
exports.dispenseMedication = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { prescription_item_id, medication_id, quantity } = req.body;

    if (!prescription_item_id || !medication_id || !quantity || quantity <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'prescription_item_id, medication_id, and a positive quantity are required.' });
    }

    // 1. Find the inventory medication
    const medication = await Medication.findByPk(medication_id, { transaction: t });
    if (!medication) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Medication not found in inventory.' });
    }

    if (medication.stock < quantity) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${medication.stock}, Requested: ${quantity}.`,
      });
    }

    // 2. Deduct stock
    const newStock = medication.stock - quantity;
    await medication.update(
      { stock: newStock, status: newStock === 0 ? 'out_of_stock' : medication.status },
      { transaction: t }
    );

    // 3. Mark the prescription item as completed (dispensed)
    const prescriptionItem = await PrescriptionItem.findByPk(prescription_item_id, { transaction: t });
    if (!prescriptionItem) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Prescription item not found.' });
    }
    await prescriptionItem.update({ status: 'completed' }, { transaction: t });

    // 4. Check if all items in the prescription are completed → mark prescription as completed
    const siblingItems = await PrescriptionItem.findAll({
      where: { prescription_id: prescriptionItem.prescription_id },
      transaction: t,
    });
    const allDone = siblingItems.every(item => item.id === prescription_item_id ? true : item.status === 'completed');
    if (allDone) {
      await Prescription.update(
        { status: 'completed' },
        { where: { id: prescriptionItem.prescription_id }, transaction: t }
      );
    }

    // 5. Audit log
    await AuditLog.create({
      user_id: req.user.id,
      action: 'medication_dispensed',
      entity_type: 'medication',
      entity_id: medication.id,
      details: {
        prescription_item_id,
        medication_name: medication.name,
        quantity_dispensed: quantity,
        remaining_stock: newStock,
      },
      ip_address: req.ip,
    }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: `Dispensed ${quantity} unit(s) of ${medication.name}. Remaining stock: ${newStock}.`,
      data: { medication, prescriptionItem },
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ─── Restock medication ──────────────────────────────────────────────────
exports.restockMedication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'A positive quantity is required.' });
    }

    const medication = await Medication.findByPk(id);
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found.' });
    }

    const newStock = medication.stock + quantity;
    await medication.update({
      stock: newStock,
      status: newStock > 0 ? 'active' : medication.status,
    });

    await AuditLog.create({
      user_id: req.user.id,
      action: 'medication_restocked',
      entity_type: 'medication',
      entity_id: medication.id,
      details: {
        medication_name: medication.name,
        quantity_added: quantity,
        new_stock: newStock,
      },
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: `Restocked ${quantity} unit(s) of ${medication.name}. New stock: ${newStock}.`,
      data: medication,
    });
  } catch (error) { next(error); }
};
