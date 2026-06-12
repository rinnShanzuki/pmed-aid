const { Notification } = require('../models');

exports.getAll = async (req, res, next) => {
  try {
    const where = { user_id: req.user.id };
    if (req.query.is_read !== undefined) where.is_read = req.query.is_read === 'true';
    if (req.query.type) where.type = req.query.type;

    const notifications = await Notification.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
    });

    const unread_count = await Notification.count({ where: { user_id: req.user.id, is_read: false } });

    res.json({ success: true, data: notifications, meta: { unread_count } });
  } catch (error) { next(error); }
};

exports.markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    if (notification.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied.' });

    await notification.update({ is_read: true });
    res.json({ success: true, data: notification });
  } catch (error) { next(error); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.user.id, is_read: false } });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) { next(error); }
};
