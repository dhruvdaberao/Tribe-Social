import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';
import { sendEmail, renderTemplate } from './emailService.js';

export const sendDailyDigests = async () => {
    try {
        console.log('🔄 Starting Daily Digest process...');

        // 1. Find users who have digest enabled
        // AND have not been disabled/deleted
        const users = await User.find({
            'notificationPrefs.emailTypes.digest': true,
            isDisabled: { $ne: true },
            isDeleted: { $ne: true }
        }).select('_id email name username');

        if (users.length === 0) {
            console.log('ℹ️ No users opted in for digests.');
            return { sent: 0, skipped: 0 };
        }

        console.log(`ℹ️ Found ${users.length} users for digest.`);

        // 2. For each user, find UNREAD notifications from last 24h
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        let sentCount = 0;

        await Promise.all(users.map(async (user) => {
            try {
                const notifications = await Notification.find({
                    recipient: user._id,
                    isRead: false,
                    createdAt: { $gte: yesterday }
                })
                    .sort({ createdAt: -1 })
                    .limit(10) // Top 10 most recent
                    .populate('sender', 'name username');

                if (notifications.length === 0) return;

                // 3. Generate Email Content
                // Group by type for nicer display
                const counts = {
                    message: 0,
                    tribe_message: 0,
                    like: 0,
                    comment: 0,
                    follow: 0,
                    other: 0
                };

                notifications.forEach(n => {
                    if (counts[n.type] !== undefined) counts[n.type]++;
                    else counts.other++;
                });

                const totalUnread = notifications.length;
                const frontendUrl = process.env.FRONTEND_URL || 'https://tribe-social.vercel.app';

                const html = await renderTemplate('dailyDigest.html', {
                    userName: user.name || user.username,
                    totalUnread: totalUnread.toString(),
                    messageCount: counts.message.toString(),
                    tribeMessageCount: counts.tribe_message.toString(),
                    likeCount: counts.like.toString(),
                    commentCount: counts.comment.toString(),
                    followCount: counts.follow.toString(),
                    dashboardUrl: `${frontendUrl}/notifications`,
                    date: new Date().toLocaleDateString()
                });

                // 4. Send Email
                await sendEmail({
                    to: user.email,
                    subject: `You missed ${totalUnread} updates on Tribe today`,
                    html
                });

                sentCount++;

            } catch (err) {
                console.error(`❌ Failed to process digest for ${user.username}:`, err);
            }
        }));

        console.log(`✅ Daily Digest complete. Sent ${sentCount} emails.`);
        return { sent: sentCount, totalCheck: users.length };

    } catch (error) {
        console.error('❌ Digest Service Error:', error);
        throw error;
    }
};
