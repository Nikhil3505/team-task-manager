const { Notification, User } = require('../models');

// Get all notifications for current user
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, unreadOnly = false } = req.query;

    const whereClause = { userId };
    if (unreadOnly === 'true') {
      whereClause.isRead = false;
    }

    const notifications = await Notification.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    // Count unread notifications
    const unreadCount = await Notification.count({
      where: { userId, isRead: false }
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.update({ isRead: true });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      error: error.message
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

// Helper function to create notification (used by other controllers)
exports.createNotification = async (userId, type, title, message, options = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedId: options.relatedId || null,
      relatedType: options.relatedType || null,
      createdBy: options.createdBy || null
    });
    
    console.log('Notification created:', notification.toJSON());
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};
