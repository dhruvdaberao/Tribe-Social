// import express from 'express';
// import protect from '../middleware/authMiddleware.js';
// import Notification from '../models/notificationModel.js';

// const router = express.Router();

// // @route   GET /api/notifications
// // @desc    Get all notifications for the current user
// router.get('/', protect, async (req, res) => {
//     try {
//         // FIX: Removed explicit 'id' from populate select string.
//         const notifications = await Notification.find({ recipient: req.user.id })
//             .populate('sender', 'name username avatarUrl')
//             .sort({ createdAt: -1 });
        
//         res.json(notifications);
//     } catch (error) {
//         console.error('Error fetching notifications:', error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// // @route   PUT /api/notifications/read
// // @desc    Mark all notifications as read
// router.put('/read', protect, async (req, res) => {
//     try {
//         await Notification.updateMany({ recipient: req.user.id }, { $set: { read: true } });
//         res.json({ message: 'Notifications marked as read' });
//     } catch (error) {
//         console.error('Error marking notifications as read:', error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// export default router;




import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Notification from '../models/notificationModel.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .populate('sender', 'name username avatarUrl')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        
        // Ensure we only return notifications where the sender still exists
        const validNotifications = notifications.filter(n => n.sender != null);
        res.json(validNotifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.put('/read', protect, async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.user.id, read: false }, { $set: { read: true } });
        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;