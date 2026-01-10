import express from 'express';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';
import protect from '../middleware/authMiddleware.js';
import { uploadImage } from '../utils/cloudinary.js';

const router = express.Router();

router.get('/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('name username avatarUrl bannerUrl bio followers following blockedUsers')
            .lean();
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ ...user, id: user._id.toString() });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (req.body.name) user.name = req.body.name;
        if (req.body.username) user.username = req.body.username;
        if (req.body.bio !== undefined) user.bio = req.body.bio;

        if (req.body.avatarUrl?.startsWith('data:image')) {
            user.avatarUrl = await uploadImage(req.body.avatarUrl, 'avatars');
        }
        if (req.body.bannerUrl?.startsWith('data:image')) {
            user.bannerUrl = await uploadImage(req.body.bannerUrl, 'banners');
        }

        await user.save();
        res.json({ ...user.toJSON(), id: user._id.toString() });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id/follow', protect, async (req, res) => {
    try {
        const targetId = req.params.id;
        const selfId = req.user.id;
        if (targetId === selfId) return res.status(400).json({ message: "Cannot follow self" });

        const targetUser = await User.findById(targetId);
        const currentUser = await User.findById(selfId);

        if (!targetUser || !currentUser) return res.status(404).json({ message: "User not found" });

        const isFollowing = currentUser.following.includes(targetId);

        if (isFollowing) {
            currentUser.following = currentUser.following.filter(id => id.toString() !== targetId);
            targetUser.followers = targetUser.followers.filter(id => id.toString() !== selfId);
        } else {
            currentUser.following.push(targetId);
            targetUser.followers.push(selfId);

            // Create notification
            const notification = new Notification({
                recipient: targetId,
                sender: selfId,
                type: 'follow'
            });
            await notification.save();
            const populated = await notification.populate('sender', 'name username avatarUrl');
            if (req.io) req.io.to(targetId).emit('newNotification', populated);
        }

        await currentUser.save();
        await targetUser.save();

        res.json({ following: currentUser.following });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', protect, async (req, res) => {
    try {
        const users = await User.find({})
            .select('name username avatarUrl bio followers following')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.json(users.map(u => ({ ...u, id: u._id.toString() })));
    } catch (error) {
        res.status(500).json([]);
    }
});

export default router;