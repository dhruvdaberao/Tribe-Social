import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';
import { normalizeNotificationPrefs } from '../utils/notificationPrefs.js';
import { sendPush } from '../services/pushService.js';

const router = express.Router();

// @route   POST /api/notifications/save-token
// @desc    Save FCM push notification token
router.post('/save-token', protect, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Valid FCM token is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.fcmToken = token;
    user.fcmTokenUpdatedAt = new Date();
    await user.save();

    console.info('[FCM] Token saved successfully.', { userId: req.user.id, tokenPreview: `${token.slice(0, 16)}...` });
    res.json({ success: true, tokenSaved: true });
  } catch (error) {
    console.error('[FCM] Error saving token:', error);
    res.status(500).json({ message: 'Failed to save token' });
  }
});

// @route   POST /api/notifications/test-push
// @desc    Send a test push notification to a specific userId
router.post('/test-push', protect, async (req, res) => {
  try {
    const targetUserId = req.body?.userId || req.user.id;

    const user = await User.findById(targetUserId).select('fcmToken pushNotifications pushPrefs');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.fcmToken) {
      return res.status(400).json({ message: 'No FCM token found for user' });
    }

    const result = await sendPush(
      user.fcmToken,
      'Tribe Social test push',
      'Your push notification system is working.',
      { url: '/notifications', type: 'test' }
    );

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to send test push', reason: result.reason });
    }

    return res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('[FCM] Error sending test push:', error);
    return res.status(500).json({ message: 'Failed to send test push', error: error?.message || String(error) });
  }
});

// @route   GET /api/notifications
// @desc    Get all notifications for the current user
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'name username avatarUrl')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/notifications/read
// @desc    Mark all notifications as read
router.put('/read', protect, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id }, { $set: { read: true } });
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/notifications/preferences
// @desc    Update notification preferences
router.post('/preferences', protect, async (req, res) => {
  try {
    const incomingPrefs = req.body?.notificationPrefs ?? req.body ?? {};
    const normalizedPrefs = normalizeNotificationPrefs(incomingPrefs);

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.notificationPrefs = normalizedPrefs;
    await user.save();

    res.json({ notificationPrefs: user.notificationPrefs });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
