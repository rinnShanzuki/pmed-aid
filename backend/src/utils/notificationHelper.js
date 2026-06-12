const { User, Notification } = require('../models');

async function notifyRole(role, payload) {
  const users = await User.findAll({
    where: { role, is_active: true },
    attributes: ['id'],
  });

  if (!users.length) return [];

  return Notification.bulkCreate(
    users.map(user => ({
      user_id: user.id,
      type: payload.type || 'alert',
      title: payload.title,
      message: payload.message,
      priority: payload.priority || 'medium',
      related_schedule_id: payload.related_schedule_id || null,
      related_prescription_id: payload.related_prescription_id || null,
      related_admission_id: payload.related_admission_id || null,
    }))
  );
}

async function notifyInfoDesk(payload) {
  return notifyRole('info_desk', payload);
}

async function createNotification(payload) {
  return Notification.create({
    user_id: payload.user_id,
    type: payload.type || 'alert',
    title: payload.title,
    message: payload.message,
    priority: payload.priority || 'medium',
    related_schedule_id: payload.related_schedule_id || null,
    related_prescription_id: payload.related_prescription_id || null,
    related_admission_id: payload.related_admission_id || null,
  });
}

module.exports = {
  notifyRole,
  notifyInfoDesk,
  createNotification,
};
