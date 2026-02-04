
import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Post from '../models/postModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';

const router = express.Router();

/**
 * Report a Post
 * Endpoint: POST /api/moderation/report-post
 * Body: { postId }
 */
router.post('/report-post', protect, async (req, res) => {
    try {
        const { postId } = req.body;
        const reporterId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Add report if not already reported by this user
        // Since IDs are objects, convert to string for comparison or rely on mongoose includes logic (which works but safer to stringify)
        // Actually mongoose arrays of ObjectIds usually support includes if passed ObjectId, but let's be safe.
        const alreadyReported = post.reports.some(id => id.toString() === reporterId.toString());

        if (!alreadyReported) {
            post.reports.push(reporterId);
            await post.save();
        }

        // Check Auto-Deletion Threshold (5 reports)
        if (post.reports.length >= 5) {
            const ownerId = post.user;

            // Delete the post
            await Post.findByIdAndDelete(postId);

            // Notify the owner
            await Notification.create({
                recipient: ownerId,
                sender: reporterId, // Or we could make this system/null if schema allows, but safer to put reporter or a dedicated admin ID
                type: 'message', // using 'message' as a fallback since 'system' isn't in schema enum from types.ts (check schema?)
                // Schema enum: 'like' | 'comment' | 'follow' | 'message' | 'story_like' | 'tribe_join'
                // We'll use 'message' and custom text.
                text: "Your post has been removed after multiple community reports. Please help us maintain a respectful and positive Tribe environment.",
                read: false,
                timestamp: new Date().toISOString()
            });

            return res.status(200).json({ message: 'Post reported and deleted due to community reports.' });
        }

        res.status(200).json({ message: 'Post reported successfully.' });

    } catch (error) {
        console.error('Error reporting post:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Report a User
 * Endpoint: POST /api/moderation/report-user
 * Body: { targetUserId }
 */
router.post('/report-user', protect, async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const reporterId = req.user._id;

        if (targetUserId === reporterId.toString()) {
            return res.status(400).json({ message: "You cannot report yourself." });
        }

        const user = await User.findById(targetUserId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Immunity Check for "Pika"
        if (user.username.toLowerCase() === 'pika') {
            return res.status(200).json({ message: 'Report received.' });
        }

        const alreadyReported = user.reports.some(id => id.toString() === reporterId.toString());

        if (!alreadyReported) {
            user.reports.push(reporterId);
            await user.save();
        }

        // Check Auto-Deletion Threshold (15 reports)
        if (user.reports.length >= 15) {
            await User.findByIdAndDelete(targetUserId);
            return res.status(200).json({ message: 'User reported and account suspended due to community reports.' });
        }

        res.status(200).json({ message: 'User reported successfully.' });

    } catch (error) {
        console.error('Error reporting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
