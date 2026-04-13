
import express from 'express';
import User from '../models/userModel.js';
import Post from '../models/postModel.js';
import Notification from '../models/notificationModel.js';
import Follow from '../models/followModel.js';
import protect from '../middleware/authMiddleware.js';
import { sendPushToUser, sendPushNotification } from '../services/pushService.js';
import { isPushEnabledFor } from '../utils/notificationPrefs.js';
import { sendEmailNotification } from '../services/emailNotificationService.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Limit 20 for free tier stability)
router.get('/', protect, async (req, res) => {
    try {
        const query = { isDeleted: { $ne: true } };
        if (!req.user?.isAdmin) {
            query.isHidden = { $ne: true };
            query.isDisabled = { $ne: true };
        }
        const users = await User.find(query)
            .select('name username avatarUrl bio')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error("Fetch users error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});


// @route   GET /api/users/:id/followers
// @desc    Get follower list by user ID
router.get('/:id/followers', protect, async (req, res) => {
    try {
        const followerLinks = await Follow.find({ following: req.params.id }).select('follower');
        const followerIds = followerLinks.map(link => link.follower);
        const followersQuery = { _id: { $in: followerIds } };
        if (!req.user?.isAdmin) {
            followersQuery.isDisabled = { $ne: true };
            followersQuery.isHidden = { $ne: true };
        }
        const followers = await User.find(followersQuery).select('name username avatarUrl bio');
        res.json(followers);
    } catch (error) {
        console.error("Error fetching followers:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/:id/following
// @desc    Get following list by user ID
router.get('/:id/following', protect, async (req, res) => {
    try {
        const followingLinks = await Follow.find({ follower: req.params.id }).select('following');
        const followingIds = followingLinks.map(link => link.following);
        const followingQuery = { _id: { $in: followingIds } };
        if (!req.user?.isAdmin) {
            followingQuery.isDisabled = { $ne: true };
            followingQuery.isHidden = { $ne: true };
        }
        const following = await User.find(followingQuery).select('name username avatarUrl bio');
        res.json(following);
    } catch (error) {
        console.error("Error fetching following:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID - WITH EXPLICIT COUNTS
router.get('/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            if ((user.isDisabled || user.isHidden || user.isDeleted) && !req.user.isAdmin) {
                return res.status(404).json({ message: 'User not found' });
            }
            // Count stats from Follow collection
            const stats = await Promise.all([
                Follow.countDocuments({ following: req.params.id }),
                Follow.countDocuments({ follower: req.params.id }),
                Follow.exists({ follower: req.user.id, following: req.params.id })
            ]);

            const [followersCount, followingCount, isFollowing] = stats;

            const userObj = user.toObject();
            userObj.id = user._id.toString();
            // Use live counts from collection (most accurate)
            userObj.followersCount = followersCount;
            userObj.followingCount = followingCount;
            userObj.isFollowedByCurrentUser = !!isFollowing;

            res.json(userObj);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: 'Server error' });
    }
});


// @route   PUT /api/users/profile
// @desc    Update user profile
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            const normalizedUsername = req.body.username ? req.body.username.trim().toLowerCase() : '';
            if (req.body.username && !/^[a-z0-9]+(?:\.[a-z0-9]+)*$/.test(normalizedUsername)) {
                return res.status(400).json({
                    message: 'Username must be lowercase and can only include letters, numbers, and single dots.',
                });
            }
            user.name = req.body.name || user.name;
            user.username = req.body.username ? normalizedUsername : user.username;
            user.bio = req.body.bio ?? user.bio;

            // Cloudinary Uploads for Base64 Images
            if (req.body.avatarUrl && req.body.avatarUrl !== user.avatarUrl) {
                const { uploadBase64ToCloudinary } = await import('../utils/cloudinaryHelper.js');
                user.avatarUrl = await uploadBase64ToCloudinary(req.body.avatarUrl, 'tribe_avatars');
            } else if (req.body.avatarUrl === null) {
                user.avatarUrl = null;
            }

            if (req.body.bannerUrl && req.body.bannerUrl !== user.bannerUrl) {
                const { uploadBase64ToCloudinary } = await import('../utils/cloudinaryHelper.js');
                user.bannerUrl = await uploadBase64ToCloudinary(req.body.bannerUrl, 'tribe_banners');
            } else if (req.body.bannerUrl === null) {
                user.bannerUrl = null;
            }

            if (req.body.email) user.email = req.body.email;
            if (req.body.password) user.password = req.body.password;

            const updatedUser = await user.save();
            const userResponse = updatedUser.toJSON();
            req.io.emit('userUpdated', userResponse);
            res.json(userResponse);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH /api/users/notification-settings
// @desc    Update push notification preferences
router.patch('/notification-settings', protect, async (req, res) => {
    try {
        const { pushNotifications, pushPrefs } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (typeof pushNotifications === 'boolean') {
            user.pushNotifications = pushNotifications;
        }

        if (pushPrefs && typeof pushPrefs === 'object') {
            user.pushPrefs = {
                ...user.pushPrefs,
                ...pushPrefs
            };
        }

        await user.save();
        res.json({ pushNotifications: user.pushNotifications, pushPrefs: user.pushPrefs });
    } catch (error) {
        console.error('Update notification settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/users/profile
// @desc    Delete user account
router.delete('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await Post.deleteMany({ user: req.user.id });

        // Remove Follow relationships
        await Follow.deleteMany({ $or: [{ follower: req.user.id }, { following: req.user.id }] });

        // Update counts for others? Too expensive to do efficiently here without bulk ops.
        // But since we are deleting this user, their ID disapears.
        // We really should decrement the counts on the people they followed or followed by.
        // Only if we care about accurate counts being eventually consistent.
        // For now, simple delete.

        await User.updateMany(
            { blockedUsers: req.user.id },
            { $pull: { blockedUsers: req.user.id } }
        );

        await user.deleteOne();
        res.json({ message: 'User account deleted successfully.' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// @route   PUT /api/users/:id/follow
// @desc    Follow / Unfollow a user - Scalable
router.put('/:id/follow', protect, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToFollow || !currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if ((userToFollow.isDisabled || userToFollow.isHidden) && !req.user?.isAdmin) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.params.id === req.user.id) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        const existingFollow = await Follow.findOne({ follower: currentUser._id, following: userToFollow._id });

        if (existingFollow) {
            // Unfollow
            await Follow.deleteOne({ _id: existingFollow._id });
            await User.findByIdAndUpdate(currentUser._id, { $inc: { followingCount: -1 } });
            await User.findByIdAndUpdate(userToFollow._id, { $inc: { followersCount: -1 } });

            await Notification.deleteOne({
                recipient: userToFollow._id,
                sender: currentUser._id,
                type: 'follow'
            });

            // Legacy Array Cleanup (Optional but good to clear if present)
            // We can skip this if we want purely scalable logic, but cleaning up legacy is nice.
            // Let's NOT write to array to be fully scalable compliant.
        } else {
            // Follow
            await Follow.create({ follower: currentUser._id, following: userToFollow._id });
            await User.findByIdAndUpdate(currentUser._id, { $inc: { followingCount: 1 } });
            await User.findByIdAndUpdate(userToFollow._id, { $inc: { followersCount: 1 } });

            const existingNotification = await Notification.findOne({
                recipient: userToFollow._id,
                sender: currentUser._id,
                type: 'follow',
            });

            if (!existingNotification) {
                const notification = new Notification({
                    recipient: userToFollow._id,
                    sender: currentUser._id,
                    type: 'follow',
                });
                await notification.save();
                const populatedNotification = await notification.populate('sender', 'name username avatarUrl');

                const recipientSocketId = req.onlineUsers.get(userToFollow._id.toString());
                if (recipientSocketId) {
                    req.io.to(recipientSocketId).emit('newNotification', populatedNotification);
                }

                await sendPushNotification({
                    user: userToFollow,
                    type: "follows",
                    title: "New Follower",
                    body: "You have a new follower"
                });
                await sendEmailNotification({
                    user: userToFollow,
                    type: 'follows',
                    subject: `${currentUser.name || 'Someone'} started following you`,
                    htmlContent: `<p>${currentUser.name || 'Someone'} started following you on Tribe Social.</p>`,
                });
            }
        }

        // Return updated User objects (with new counts)
        // We need to re-fetch to get new counts or just increment locally.
        // Re-fetching is safer.
        const updatedCurrentUser = await User.findById(currentUser._id);
        const updatedUserToFollow = await User.findById(userToFollow._id);

        // We should enrich with counts from Collection if we want to be 100% accurate,
        // but Since we just did $inc, value on doc should be correct.

        req.io.emit('userUpdated', updatedCurrentUser.toJSON());
        req.io.emit('userUpdated', updatedUserToFollow.toJSON());

        res.json({ message: 'Follow status updated' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

const handleBlockUser = async (req, res, targetUserId) => {
    try {
        const userToBlock = await User.findById(targetUserId);
        const currentUser = await User.findById(req.user.id);

        if (!userToBlock || !currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (targetUserId === req.user.id) {
            return res.status(400).json({ message: 'You cannot block yourself' });
        }

        const isBlocked = currentUser.blockedUsers.includes(userToBlock._id);

        if (isBlocked) {
            // Unblock
            currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id.toString() !== userToBlock._id.toString());
        } else {
            // Block
            currentUser.blockedUsers.push(userToBlock._id);

            // Force Unfollow (Both directions)
            const follow1 = await Follow.findOneAndDelete({ follower: currentUser._id, following: userToBlock._id });
            if (follow1) {
                await User.findByIdAndUpdate(currentUser._id, { $inc: { followingCount: -1 } });
                await User.findByIdAndUpdate(userToBlock._id, { $inc: { followersCount: -1 } });
            }

            const follow2 = await Follow.findOneAndDelete({ follower: userToBlock._id, following: currentUser._id });
            if (follow2) {
                await User.findByIdAndUpdate(userToBlock._id, { $inc: { followingCount: -1 } });
                await User.findByIdAndUpdate(currentUser._id, { $inc: { followersCount: -1 } });
            }
        }

        await currentUser.save();
        // userToBlock not saved unless we modified it? We modified valid counts via update.

        const updatedCurrentUser = await User.findById(currentUser._id);
        // We broadcast user update.
        req.io.emit('userUpdated', updatedCurrentUser.toJSON());
        // Also userToBlock ? Only if we unfollowed them on their side.
        // Let's broadcast both to be safe.
        const updatedUserToBlock = await User.findById(userToBlock._id);
        req.io.emit('userUpdated', updatedUserToBlock.toJSON());

        return res.json({ message: 'Block status updated' });

    } catch (error) {
        console.error('Block user error:', error);
        return res.status(500).json({ message: 'Server Error' });
    }
};

// @route   PUT /api/users/:id/block
// @desc    Block / Unblock a user
router.put('/:id/block', protect, async (req, res) => {
    return handleBlockUser(req, res, req.params.id);
});

// @route   POST /api/users/block-user
// @desc    Explicit block endpoint for messaging flow
router.post('/block-user', protect, async (req, res) => {
    const blockedUserId = req.body?.blockedUserId;
    if (!blockedUserId) {
        return res.status(400).json({ message: 'blockedUserId is required' });
    }
    return handleBlockUser(req, res, blockedUserId);
});


// @route   PUT /api/users/:id/remove-follower
// @desc    Remove a user from your followers list
router.put('/:id/remove-follower', protect, async (req, res) => {
    try {
        const userToRemove = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToRemove || !currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if they follow me
        const followRel = await Follow.findOne({ follower: userToRemove._id, following: currentUser._id });

        if (followRel) {
            await Follow.deleteOne({ _id: followRel._id });

            // Update Counts
            await User.findByIdAndUpdate(userToRemove._id, { $inc: { followingCount: -1 } });
            await User.findByIdAndUpdate(currentUser._id, { $inc: { followersCount: -1 } });

            // Refresh docs
            const updatedCurrentUser = await User.findById(currentUser._id);
            const updatedUserToRemove = await User.findById(userToRemove._id);

            req.io.emit('userUpdated', updatedCurrentUser.toJSON());
            req.io.emit('userUpdated', updatedUserToRemove.toJSON());

            res.json({ message: 'Follower removed successfully' });
        } else {
            res.status(400).json({ message: 'User is not following you' });
        }

    } catch (error) {
        console.error('Remove follower error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PATCH /api/users/notification-settings
// @desc    Update user email notification settings
router.patch('/notification-settings', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { emailNotifications, emailPrefs } = req.body || {};

        if (emailNotifications !== undefined && typeof emailNotifications !== 'boolean') {
            return res.status(400).json({ message: 'emailNotifications must be a boolean' });
        }

        const allowedPrefs = new Set([
            'newDeviceLogin',
            'dailyDigest',
            'moderationAlerts',
        ]);

        if (emailPrefs !== undefined) {
            if (!emailPrefs || typeof emailPrefs !== 'object' || Array.isArray(emailPrefs)) {
                return res.status(400).json({ message: 'emailPrefs must be an object' });
            }
            for (const [key, value] of Object.entries(emailPrefs)) {
                if (!allowedPrefs.has(key)) {
                    return res.status(400).json({ message: `Unsupported email preference: ${key}` });
                }
                if (typeof value !== 'boolean') {
                    return res.status(400).json({ message: `emailPrefs.${key} must be a boolean` });
                }
            }
        }

        if (typeof emailNotifications === 'boolean') {
            user.emailNotifications = emailNotifications;
        }

        const existingPrefsRaw = user.emailPrefs?.toObject ? user.emailPrefs.toObject() : (user.emailPrefs || {});
        const existingPrefs = Object.fromEntries(
            Object.entries(existingPrefsRaw).filter(([key]) => allowedPrefs.has(key))
        );
        user.emailPrefs = {
            newDeviceLogin: true,
            dailyDigest: true,
            moderationAlerts: true,
            ...existingPrefs,
            ...(emailPrefs || {}),
        };

        await user.save();

        return res.json({
            emailNotifications: user.emailNotifications !== false,
            emailPrefs: user.emailPrefs,
        });
    } catch (error) {
        console.error('Update email notification settings error:', error);
        return res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
