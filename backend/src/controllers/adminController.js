const { User, Patient, Admission, Prescription, MedicationSchedule, MedicationLog } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
  try {
    // ── KPI Cards ──
    const totalPatients = await Patient.count();
    const activePatients = await Admission.count({ where: { status: 'admitted' } });
    const totalDoctors = await User.count({ where: { role: 'doctor' } });
    const totalNurses = await User.count({ where: { role: 'nurse' } });
    const totalPrescriptions = await Prescription.count();

    // Adherence Rate: completed / (completed + missed) * 100
    const completedSchedules = await MedicationSchedule.count({ where: { status: 'completed' } });
    const missedSchedules = await MedicationSchedule.count({ where: { status: 'missed' } });
    const pendingSchedules = await MedicationSchedule.count({ where: { status: 'pending' } });
    const totalRelevant = completedSchedules + missedSchedules + pendingSchedules;
    const adherenceRate = totalRelevant > 0
      ? ((completedSchedules / totalRelevant) * 100).toFixed(1)
      : 0;

    // ── Chart 1: Monthly Medication Adherence Trend (last 4 months) ──
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const adherenceTrend = [];

    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const completed = await MedicationSchedule.count({
        where: { status: 'completed', scheduled_time: { [Op.between]: [start, end] } }
      });
      const missed = await MedicationSchedule.count({
        where: { status: 'missed', scheduled_time: { [Op.between]: [start, end] } }
      });
      const pending = await MedicationSchedule.count({
        where: { status: 'pending', scheduled_time: { [Op.between]: [start, end] } }
      });
      const total = completed + missed + pending;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      adherenceTrend.push({ month: monthNames[d.getMonth()], rate });
    }

    // ── Chart 2: Medication Status Distribution ──
    const totalSchedules = completedSchedules + missedSchedules + pendingSchedules;
    const medicationDistribution = totalSchedules > 0
      ? [
          { name: 'Completed', value: Math.round((completedSchedules / totalSchedules) * 100) },
          { name: 'Pending',   value: Math.round((pendingSchedules / totalSchedules) * 100) },
          { name: 'Missed',    value: Math.round((missedSchedules / totalSchedules) * 100) },
        ]
      : [
          { name: 'Completed', value: 78 },
          { name: 'Pending',   value: 15 },
          { name: 'Missed',    value: 7 },
        ];

    // ── Chart 3: Patient Admission Trend ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Daily (last 7 days)
    const dailyAdmissions = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today);
      dayStart.setDate(today.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await Admission.count({
        where: { admission_date: { [Op.between]: [dayStart, dayEnd] } }
      });
      dailyAdmissions.push({ label: dayNames[dayStart.getDay()], value: count });
    }

    // Weekly (last 4 weeks)
    const weeklyAdmissions = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i + 1) * 7);
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - i * 7);
      weekEnd.setHours(23, 59, 59, 999);

      const count = await Admission.count({
        where: { admission_date: { [Op.between]: [weekStart, weekEnd] } }
      });
      weeklyAdmissions.push({ label: `Week ${4 - i}`, value: count });
    }

    // Monthly (last 6 months)
    const monthlyAdmissions = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const count = await Admission.count({
        where: { admission_date: { [Op.between]: [start, end] } }
      });
      monthlyAdmissions.push({ label: monthNames[d.getMonth()], value: count });
    }

    res.json({
      success: true,
      data: {
        totalPatients,
        activePatients,
        totalDoctors,
        totalNurses,
        totalPrescriptions,
        adherenceRate,
        adherenceTrend,
        medicationDistribution,
        admissionTrend: {
          daily: dailyAdmissions,
          weekly: weeklyAdmissions,
          monthly: monthlyAdmissions,
        }
      }
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching dashboard stats.' });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const { Setting } = require('../models');
    const settings = await Setting.findAll();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { Setting } = require('../models');
    const settingsUpdates = req.body.settings;
    
    if (!Array.isArray(settingsUpdates)) {
      return res.status(400).json({ success: false, message: 'Invalid format.' });
    }

    for (const item of settingsUpdates) {
      await Setting.upsert({ key: item.key, value: item.value });
    }

    res.json({ success: true, message: 'Settings updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
};
