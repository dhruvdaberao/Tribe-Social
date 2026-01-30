import express from 'express';
import protect from '../middleware/authMiddleware.js';
import PushSubscription from '../models/pushSubscriptionModel.js';

const router = express.Router();

// Get VAPID public key
router.get('/public-key', (req, res) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;

    if (!publicKey) {
        return res.status(503).json({ message: 'Push notifications not configured' });
    }

    res.json({ publicKey });
});

// Subscribe to push notifications
router.post('/subscribe', protect, async (req, res) => {
    try {
        const { endpoint, keys } = req.body;

        if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
            return res.status(400).json({ message: 'Invalid subscription data' });
        }

        // Upsert subscription (update if exists, create if not)
        const subscription = await PushSubscription.findOneAndUpdate(
            { userId: req.user.id, endpoint },
            {
                userId: req.user.id,
                endpoint,
                keys: {
                    p256dh: keys.p256dh,
                    auth: keys.auth
                },
                lastUsed: new Date()
            },
            { upsert: true, new: true }
        );

        res.status(201).json({
            message: 'Subscription saved successfully',
            subscription: { id: subscription._id }
        });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ message: 'Failed to save subscription' });
    }
});

// Unsubscribe from push notifications
router.delete('/unsubscribe', protect, async (req, res) => {
    try {
        const { endpoint } = req.body;

        if (!endpoint) {
            return res.status(400).json({ message: 'Endpoint required' });
        }

        await PushSubscription.deleteOne({
            userId: req.user.id,
            endpoint
        });

        res.json({ message: 'Unsubscribed successfully' });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ message: 'Failed to unsubscribe' });
    }
});

export default router;
