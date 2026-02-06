import express from 'express';
import rateLimit from 'express-rate-limit';
import protect from '../middleware/authMiddleware.js';
import PushSubscription from '../models/pushSubscriptionModel.js';

const router = express.Router();

const subscriptionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
});

const getPublicKeyResponse = (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(503).json({ message: 'Push notifications not configured' });
  }
  return res.json({ publicKey });
};

const isValidSubscription = (subscription) => {
  return Boolean(
    subscription &&
      typeof subscription.endpoint === 'string' &&
      subscription.keys &&
      typeof subscription.keys.p256dh === 'string' &&
      typeof subscription.keys.auth === 'string'
  );
};

router.get('/vapidPublicKey', getPublicKeyResponse);
router.get('/public-key', getPublicKeyResponse);

router.post('/subscribe', protect, subscriptionLimiter, async (req, res) => {
  try {
    const { subscription, deviceLabel } = req.body;

    if (!isValidSubscription(subscription)) {
      return res.status(400).json({ message: 'Invalid subscription data' });
    }

    const { endpoint, keys } = subscription;
    const userAgent = req.headers['user-agent'] || '';

    const saved = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        user: req.user.id,
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        userAgent,
        deviceLabel: deviceLabel || '',
        lastUsedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      message: 'Subscription saved successfully',
      subscription: { id: saved._id },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save subscription' });
  }
});

router.post('/unsubscribe', protect, subscriptionLimiter, async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ message: 'Endpoint required' });
    }

    await PushSubscription.deleteOne({
      user: req.user.id,
      endpoint,
    });

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unsubscribe' });
  }
});

export default router;
