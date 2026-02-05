
import express from 'express';
import User from '../models/userModel.js';
import Post from '../models/postModel.js';
import Notification from '../models/notificationModel.js';
import Follow from '../models/followModel.js';
import { isValidUsername, normalizeUsername, usernameValidationMessage } from '../utils/usernameValidation.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

const buildUserResponse = async (userId, currentUserId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) return null;
    const [followersCount, followingCount, isFollowing] = await Promise.all([
        Follow.countDocuments({ following: userId }),
        Follow.countDocuments({ follower: userId }),
        currentUserId ? Follow.exists({ follower: currentUserId, following: userId }) : false
    ]);

    const userObj = user.toObject();
    userObj.id = user._id.toString();
    userObj.followersCount = followersCount;
    userObj.followingCount = followingCount;
    userObj.isFollowedByCurrentUser = !!isFollowing;
    return userObj;
};

const syncUserFollowArrays = async (userId) => {
    const [followerLinks, followingLinks] = await Promise.all([
        Follow.find({ following: userId }).select('follower'),
        Follow.find({ follower: userId }).select('following')
    ]);
    const followerIds = followerLinks.map(link => link.follower);
    const followingIds = followingLinks.map(link => link.following);
    await User.findByIdAndUpdate(userId, {
        $set: { followers: followerIds, following: followingIds }
    });
};

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
            .sort({ createdAt: -1 })
            .limit(20);
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
            const userObj = await buildUserResponse(user._id, req.user.id);
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
            user.name = req.body.name || user.name;
            if (typeof req.body.username === 'string') {
                const normalizedUsername = normalizeUsername(req.body.username);
                if (!isValidUsername(normalizedUsername)) {
                    return res.status(400).json({ message: usernameValidationMessage });
                }
                const usernameExists = await User.findOne({ username: normalizedUsername, _id: { $ne: user._id } });
                if (usernameExists) {
                    return res.status(400).json({ message: 'This username is already taken.' });
                }
                user.username = normalizedUsername;
            }
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
        const requestedAction = req.body?.action === 'follow' || req.body?.action === 'unfollow'
            ? req.body.action
            : null;
        const isCurrentlyFollowing = !!existingFollow;
        const shouldFollow = requestedAction === 'follow'
            ? true
            : requestedAction === 'unfollow'
                ? false
                : !isCurrentlyFollowing;

        if (shouldFollow && !isCurrentlyFollowing) {
            await Follow.create({ follower: currentUser._id, following: userToFollow._id });
            await Promise.all([
                User.findByIdAndUpdate(currentUser._id, { $addToSet: { following: userToFollow._id } }),
                User.findByIdAndUpdate(userToFollow._id, { $addToSet: { followers: currentUser._id } })
            ]);

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
            }
        }

        if (!shouldFollow && isCurrentlyFollowing) {
            await Follow.deleteOne({ _id: existingFollow._id });
            await Promise.all([
                User.findByIdAndUpdate(currentUser._id, { $pull: { following: userToFollow._id } }),
                User.findByIdAndUpdate(userToFollow._id, { $pull: { followers: currentUser._id } })
            ]);

            await Notification.deleteOne({
                recipient: userToFollow._id,
                sender: currentUser._id,
                type: 'follow'
            });
        }

        await Promise.all([
            syncUserFollowArrays(currentUser._id),
            syncUserFollowArrays(userToFollow._id)
        ]);

        const [updatedCurrentUser, updatedUserToFollow] = await Promise.all([
            buildUserResponse(currentUser._id, currentUser._id),
            buildUserResponse(userToFollow._id, currentUser._id)
        ]);

        req.io.emit('userUpdated', updatedCurrentUser);
        req.io.emit('userUpdated', updatedUserToFollow);

        res.json({
            message: 'Follow status updated',
            currentUser: updatedCurrentUser,
            targetUser: updatedUserToFollow,
            isFollowing: shouldFollow
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/users/:id/block
// @desc    Block / Unblock a user
router.put('/:id/block', protect, async (req, res) => {
    try {
        const userToBlock = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToBlock || !currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.params.id === req.user.id) {
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
                await Promise.all([
                    User.findByIdAndUpdate(currentUser._id, { $pull: { following: userToBlock._id } }),
                    User.findByIdAndUpdate(userToBlock._id, { $pull: { followers: currentUser._id } })
                ]);
            }

            const follow2 = await Follow.findOneAndDelete({ follower: userToBlock._id, following: currentUser._id });
            if (follow2) {
                await Promise.all([
                    User.findByIdAndUpdate(userToBlock._id, { $pull: { following: currentUser._id } }),
                    User.findByIdAndUpdate(currentUser._id, { $pull: { followers: userToBlock._id } })
                ]);
            }
        }

        await currentUser.save();
        // userToBlock not saved unless we modified it? We modified valid counts via update.

        await Promise.all([
            syncUserFollowArrays(currentUser._id),
            syncUserFollowArrays(userToBlock._id)
        ]);

        const updatedCurrentUser = await buildUserResponse(currentUser._id, currentUser._id);
        const updatedUserToBlock = await buildUserResponse(userToBlock._id, currentUser._id);
        req.io.emit('userUpdated', updatedCurrentUser);
        req.io.emit('userUpdated', updatedUserToBlock);

        res.json({ message: 'Block status updated' });

    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
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

            await Promise.all([
                User.findByIdAndUpdate(userToRemove._id, { $pull: { following: currentUser._id } }),
                User.findByIdAndUpdate(currentUser._id, { $pull: { followers: userToRemove._id } })
            ]);

            await Promise.all([
                syncUserFollowArrays(currentUser._id),
                syncUserFollowArrays(userToRemove._id)
            ]);

            const updatedCurrentUser = await buildUserResponse(currentUser._id, currentUser._id);
            const updatedUserToRemove = await buildUserResponse(userToRemove._id, currentUser._id);
            req.io.emit('userUpdated', updatedCurrentUser);
            req.io.emit('userUpdated', updatedUserToRemove);

            res.json({ message: 'Follower removed successfully' });
        } else {
            res.status(200).json({ message: 'User is not following you' });
        }

    } catch (error) {
        console.error('Remove follower error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
