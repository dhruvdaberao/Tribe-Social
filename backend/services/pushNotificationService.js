import webpush from 'web-push';
import PushSubscription from '../models/pushSubscriptionModel.js';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:support@tribe-social.com';

if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('⚠️  VAPID keys not configured. Push notifications will not work.');
    console.warn('   Run: npx web-push generate-vapid-keys');
    console.warn('   Then add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to .env');
} else {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

// Throttle map: userId-eventType -> lastNotificationTime
const notificationThrottle = new Map();
const THROTTLE_DURATION = 60 * 1000; // 1 minute

/**
 * Send push notification to a user
 * @param {string} userId - Target user ID
 * @param {object} payload - Notification payload
 * @param {string} eventType - Event type for throttling
 */
export const sendPushNotification = async (userId, payload, eventType = 'default') => {
    try {
        // Throttle check
        const throttleKey = `${userId}-${eventType}`;
        const lastNotificationTime = notificationThrottle.get(throttleKey);
        const now = Date.now();

        if (lastNotificationTime && (now - lastNotificationTime) < THROTTLE_DURATION) {
            console.log(`🔕 Throttled notification for ${userId} (${eventType})`);
            return;
        }

        // Get all subscriptions for user
        const subscriptions = await PushSubscription.find({ userId });

        if (subscriptions.length === 0) {
            return; // User has no subscriptions
        }

        // Send to all user's devices
        const sendPromises = subscriptions.map(async (subscription) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: subscription.keys.p256dh,
                            auth: subscription.keys.auth
                        }
                    },
                    JSON.stringify(payload)
                );

                // Update lastUsed
                subscription.lastUsed = new Date();
                await subscription.save();

                console.log(`✅ Push sent to ${userId}`);
            } catch (error) {
                // Handle expired/invalid subscriptions
                if (error.statusCode === 410 || error.statusCode === 404) {
                    console.log(`🗑️  Removing invalid subscription for ${userId}`);
                    await PushSubscription.deleteOne({ _id: subscription._id });
                } else {
                    console.error(`❌ Push send failed for ${userId}:`, error.message);
                }
            }
        });

        await Promise.allSettled(sendPromises);

        // Update throttle
        notificationThrottle.set(throttleKey, now);

    } catch (error) {
        console.error('Push notification error:', error);
    }
};

/**
 * Build notification payload
 */
export const buildNotificationPayload = (type, data) => {
    const payloads = {
        message: {
            title: `New message from ${data.senderName}`,
            body: data.messagePreview,
            icon: '/logo.png',
            badge: '/logo.png',
            data: {
                type: 'message',
                userId: data.senderId,
                url: `/messages/${data.conversationId}`
            }
        },
        tribe_message: {
            title: `${data.tribeName}`,
            body: `${data.senderName}: ${data.messagePreview}`,
            icon: '/logo.png',
            badge: '/logo.png',
            data: {
                type: 'tribe_message',
                tribeId: data.tribeId,
                url: `/tribes/${data.tribeId}`
            }
        },
        post_like: {
            title: `${data.likerName} liked your post`,
            body: data.postPreview || '',
            icon: '/logo.png',
            badge: '/logo.png',
            data: {
                type: 'post_like',
                postId: data.postId,
                url: `/`
            }
        },
        story_like: {
            title: `${data.likerName} liked your story`,
            body: '',
            icon: '/logo.png',
            badge: '/logo.png',
            data: {
                type: 'story_like',
                storyId: data.storyId,
                url: `/`
            }
        }
    };

    return payloads[type] || null;
};
