import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';
import { normalizeNotificationPrefs } from '../utils/notificationPrefs.js';

const router = express.Router();

// @route   POST /api/notifications/save-token
// @desc    Save FCM push notification token
router.post('/save-token', protect, async (req, res) => {
    try {
        const { token } = req.body;
        await User.findByIdAndUpdate(req.user.id, {
            fcmToken: token
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving FCM token:', error);
        res.status(500).json({ message: 'Failed to save token' });
    }
});

// @route   GET /api/notifications
// @desc    Get all notifications for the current user
router.get('/', protect, async (req, res) => {
    try {
        // FIX: Removed explicit 'id' from populate select string.
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
