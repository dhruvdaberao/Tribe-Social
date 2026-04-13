import webpush from 'web-push';
import PushSubscription from '../models/pushSubscriptionModel.js';
import User from '../models/userModel.js';
import admin, { isFirebaseAdminReady } from '../firebaseAdmin.js';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || process.env.VAPID_EMAIL || 'mailto:support@tribe-social.com';

const vapidConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

if (vapidConfigured) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const serializeSubscription = (subscription) => ({
  endpoint: subscription.endpoint,
  keys: {
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  },
});

const sendToSubscriptions = async (subscriptions, payload) => {
  if (!vapidConfigured || subscriptions.length === 0) {
    return;
  }

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(serializeSubscription(subscription), JSON.stringify(payload));
        subscription.lastUsedAt = new Date();
        await subscription.save();
      } catch (error) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: subscription._id });
          return;
        }
        throw error;
      }
    })
  );
};

export const sendPushToUser = async (userId, payload) => {
  const subscriptions = await PushSubscription.find({ user: userId });
  await sendToSubscriptions(subscriptions, payload);
};

export const sendPushToUsers = async (userIds, payload) => {
  if (!userIds || userIds.length === 0) return;
  const subscriptions = await PushSubscription.find({ user: { $in: userIds } });
  await sendToSubscriptions(subscriptions, payload);
};

export const sendPush = async (token, title, body, data = {}) => {
  if (!token) {
    console.warn('[FCM] sendPush skipped because token is missing.');
    return { success: false, reason: 'missing-token' };
  }

  if (!isFirebaseAdminReady()) {
    console.warn('[FCM] sendPush skipped because Firebase Admin is not initialized.');
    return { success: false, reason: 'firebase-admin-not-ready' };
  }

  try {
    const messageId = await admin.messaging().send({
      token,
      notification: {
        title,
        body,
      },
      data,
      webpush: {
        notification: {
          title,
          body,
          icon: '/icons/icon-192-dark.png',
        },
      },
    });

    console.info('[FCM] Push sent successfully:', { messageId });
    return { success: true, messageId };
  } catch (error) {
    const code = error?.errorInfo?.code || error?.code;
    console.error('[FCM] Push send failed:', code || error?.message || error);
    return { success: false, reason: code || 'send-failed', error };
  }
};

export const sendPushNotification = async ({ user, type, title, body, data = {} }) => {
  if (!user || !user._id) return;

  if (!user.fcmToken) {
    console.info('[FCM] User has no fcmToken, skipping push.', { userId: user._id });
    return;
  }

  if (user.pushNotifications === false) {
    console.info('[FCM] User pushNotifications disabled, skipping push.', { userId: user._id });
    return;
  }

  if (user.pushPrefs && user.pushPrefs[type] === false) {
    console.info('[FCM] User pushPrefs disabled for type, skipping push.', { userId: user._id, type });
    return;
  }

  const result = await sendPush(user.fcmToken, title, body, data);

  if (!result.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(result.reason)) {
    await User.findByIdAndUpdate(user._id, { $set: { fcmToken: null, fcmTokenUpdatedAt: new Date() } });
    console.warn('[FCM] Cleared stale FCM token for user:', user._id.toString());
  }
};
