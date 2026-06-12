const { MedicationSchedule, Prescription, PrescriptionItem, MedicationLog, User } = require('../models');
const { fn, col, Op, literal } = require('sequelize');

exports.adherence = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.patient_id) where.patient_id = req.query.patient_id;
    if (req.query.from_date) where.scheduled_time = { ...where.scheduled_time, [Op.gte]: req.query.from_date };
    if (req.query.to_date)   where.scheduled_time = { ...where.scheduled_time, [Op.lte]: req.query.to_date };

    const rows = await MedicationSchedule.findAll({
      where,
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    const stats = rows.reduce((acc, r) => { acc[r.status] = parseInt(r.count, 10); return acc; }, {});
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    const nonPending = total - (stats.pending || 0);
    const adherenceRate = nonPending > 0
      ? Math.round(((stats.completed || 0) / nonPending) * 10000) / 100
      : 0;

    res.json({
      success: true,
      data: {
        total_doses: total,
        completed:   stats.completed || 0,
        missed:      stats.missed    || 0,
        skipped:     stats.skipped   || 0,
        pending:     stats.pending   || 0,
        adherence_rate: adherenceRate,
      },
    });
  } catch (error) { next(error); }
};

exports.medicationTrends = async (req, res, next) => {
  try {
    const prescriptionWhere = {};
    if (req.query.from_date) prescriptionWhere.created_at = { [Op.gte]: req.query.from_date };
    if (req.query.to_date)   prescriptionWhere.created_at = { ...prescriptionWhere.created_at, [Op.lte]: req.query.to_date };

    const trends = await PrescriptionItem.findAll({
      attributes: [
        'medication_name',
        [fn('COUNT', literal('DISTINCT `prescription`.`id`')), 'prescription_count'],
        [fn('COUNT', col('PrescriptionItem.id')), 'item_count'],
      ],
      include: [{
        model: Prescription,
        as: 'prescription',
        where: prescriptionWhere,
        attributes: [],
      }],
      group: ['medication_name'],
      order: [[literal('prescription_count'), 'DESC']],
      limit: parseInt(req.query.limit) || 20,
      subQuery: false,
    });

    res.json({ success: true, data: trends });
  } catch (error) { next(error); }
};

exports.staffPerformance = async (req, res, next) => {
  try {
    const logWhere = {};
    if (req.query.from_date) logWhere.created_at = { [Op.gte]: req.query.from_date };
    if (req.query.to_date)   logWhere.created_at = { ...logWhere.created_at, [Op.lte]: req.query.to_date };

    const staff = await User.findAll({
      where: { role: ['nurse', 'doctor'] },
      attributes: [
        'id', 'first_name', 'last_name', 'role',
        [fn('COUNT', col('medicationActions.id')), 'total_actions'],
        [fn('SUM', literal("CASE WHEN `medicationActions`.`action` = 'administered' THEN 1 ELSE 0 END")), 'doses_administered'],
        [fn('SUM', literal("CASE WHEN `medicationActions`.`action` = 'skipped' THEN 1 ELSE 0 END")), 'doses_skipped'],
      ],
      include: [{
        model: MedicationLog,
        as: 'medicationActions',
        where: Object.keys(logWhere).length ? logWhere : undefined,
        required: false,
        attributes: [],
      }],
      group: ['User.id'],
      order: [[literal('doses_administered'), 'DESC']],
      subQuery: false,
    });

    res.json({ success: true, data: staff });
  } catch (error) { next(error); }
};
