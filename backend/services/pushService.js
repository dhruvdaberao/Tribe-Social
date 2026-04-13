import webpush from 'web-push';
import PushSubscription from '../models/pushSubscriptionModel.js';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:support@tribe-social.com';

const vapidConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

if (vapidConfigured) {
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT, // must be mailto: or https://
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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

import admin from "../firebaseAdmin.js";

export const sendPush = async (token, title, body) => {
  if (!token) return;

  try {
    await admin.messaging().send({
      token,
      notification: {
        title,
        body
      }
    });

    console.log("Push sent");
  } catch (err) {
    console.error("Push error:", err.message);
  }
};

export const sendPushNotification = async ({
  user,
  type,
  title,
  body
}) => {
  if (!user || !user.fcmToken) return;

  if (user.pushNotifications === false) return;

  if (user.pushPrefs && user.pushPrefs[type] === false) return;

  await sendPush(user.fcmToken, title, body);
};
