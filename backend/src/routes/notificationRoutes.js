const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const Notification = require('../models/notificationModel');

// Get all notifications for the current user
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

// Mark a notification as read
router.put('/:notificationId/read', verifyToken, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, userId: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    next(error);
  }
});

module.exports = router;