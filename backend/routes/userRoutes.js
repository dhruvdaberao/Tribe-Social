




// Cleaned up legacy comments




// //         if (req.params.id === req.user.id) {
// //             return res.status(400).json({ message: 'You cannot block yourself' });
// //         }

// //         const isBlocked = currentUser.blockedUsers.includes(userToBlock._id);

// //         if (isBlocked) {
// //             // Unblock
// //             currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id.toString() !== userToBlock._id.toString());
// //         } else {
// //             // Block
// //             currentUser.blockedUsers.push(userToBlock._id);
// //             // Also force unfollow from both sides
// //             currentUser.following = currentUser.following.filter(id => id.toString() !== userToBlock._id.toString());
// //             userToBlock.followers = userToBlock.followers.filter(id => id.toString() !== currentUser._id.toString());
// //             // And remove from their following list
// //             userToBlock.following = userToBlock.following.filter(id => id.toString() !== currentUser._id.toString());
// //             currentUser.followers = currentUser.followers.filter(id => id.toString() !== userToBlock._id.toString());
// //         }

// //         await currentUser.save();
// //         await userToBlock.save();

// //         req.io.emit('userUpdated', currentUser.toJSON());
// //         req.io.emit('userUpdated', userToBlock.toJSON());

// //         res.json({ message: 'Block status updated' });

// //     } catch (error) {
// //         console.error('Block user error:', error);
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });


// // export default router;






// import express from 'express';
// import User from '../models/userModel.js';
// import Post from '../models/postModel.js';
// import Notification from '../models/notificationModel.js';
// import protect from '../middleware/authMiddleware.js';

// const router = express.Router();

// // @route   GET /api/users
// // @desc    Get all users (Limit 20 for free tier stability)
// router.get('/', protect, async (req, res) => {
//     try {
//         const users = await User.find({})
//             .select('name username avatarUrl bio') // Select only needed fields
//             .sort({ createdAt: -1 })
//             .limit(20); // Critical limit to prevent OOM
//         res.json(users);
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });


// // @route   GET /api/users/:id
// // @desc    Get user profile by ID
// router.get('/:id', protect, async (req, res) => {
//     try {
//         const user = await User.findById(req.params.id).select('-password');
//         if (user) {
//             res.json(user);
//         } else {
//             res.status(404).json({ message: 'User not found' });
//         }
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });


// // @route   PUT /api/users/profile
// // @desc    Update user profile (Name, Bio, Email, Password)
// router.put('/profile', protect, async (req, res) => {
//     try {
//         const user = await User.findById(req.user.id);
//         if (user) {
//             user.name = req.body.name || user.name;
//             user.username = req.body.username || user.username;
//             user.bio = req.body.bio ?? user.bio;
//             user.avatarUrl = req.body.avatarUrl === null ? null : req.body.avatarUrl || user.avatarUrl;
//             user.bannerUrl = req.body.bannerUrl === null ? null : req.body.bannerUrl || user.bannerUrl;

//             // Allow updating email
//             if (req.body.email) {
//                 user.email = req.body.email;
//             }

//             // Allow updating password
//             if (req.body.password) {
//                 user.password = req.body.password; // Will be hashed by pre-save hook in model
//             }

//             const updatedUser = await user.save();

//             // Don't send password back
//             const userResponse = updatedUser.toJSON();

//             req.io.emit('userUpdated', userResponse);

//             res.json(userResponse);
//         } else {
//             res.status(404).json({ message: 'User not found' });
//         }
//     } catch (error) {
//         console.error("Update profile error:", error);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // @route   DELETE /api/users/profile
// // @desc    Delete user account
// router.delete('/profile', protect, async (req, res) => {
//     try {
//         const user = await User.findById(req.user.id);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         await Post.deleteMany({ user: req.user.id });

//         await User.updateMany(
//             { $or: [{ followers: req.user.id }, { following: req.user.id }, { blockedUsers: req.user.id }] },
//             { $pull: { followers: req.user.id, following: req.user.id, blockedUsers: req.user.id } }
//         );

//         await user.deleteOne();
//         res.json({ message: 'User account deleted successfully.' });
//     } catch (error) {
//         console.error('Delete account error:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// });


// // @route   PUT /api/users/:id/follow
// // @desc    Follow / Unfollow a user
// router.put('/:id/follow', protect, async (req, res) => {
//     try {
//         const userToFollow = await User.findById(req.params.id);
//         const currentUser = await User.findById(req.user.id);

//         if (!userToFollow || !currentUser) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         if (req.params.id === req.user.id) {
//             return res.status(400).json({ message: 'You cannot follow yourself' });
//         }

//         const isFollowing = currentUser.following.includes(userToFollow._id);

//         if (isFollowing) {
//             // Unfollow
//             currentUser.following = currentUser.following.filter(id => id.toString() !== userToFollow._id.toString());
//             userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== currentUser._id.toString());
//             // Delete the corresponding follow notification
//             await Notification.deleteOne({
//                 recipient: userToFollow._id,
//                 sender: currentUser._id,
//                 type: 'follow'
//             });
//         } else {
//             // Follow
//             currentUser.following.push(userToFollow._id);
//             userToFollow.followers.push(currentUser._id);

//             const existingNotification = await Notification.findOne({
//                 recipient: userToFollow._id,
//                 sender: currentUser._id,
//                 type: 'follow',
//             });

//             if (!existingNotification) {
//                 const notification = new Notification({
//                     recipient: userToFollow._id,
//                     sender: currentUser._id,
//                     type: 'follow',
//                 });
//                 await notification.save();
//                 const populatedNotification = await notification.populate('sender', 'name username avatarUrl');

//                 const recipientSocketId = req.onlineUsers.get(userToFollow._id.toString());
//                 if (recipientSocketId) {
//                     req.io.to(recipientSocketId).emit('newNotification', populatedNotification);
//                 }
//             }
//         }

//         await currentUser.save();
//         await userToFollow.save();

//         req.io.emit('userUpdated', currentUser.toJSON());
//         req.io.emit('userUpdated', userToFollow.toJSON());

//         res.json({ message: 'Follow status updated' });

//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// // @route   PUT /api/users/:id/block
// // @desc    Block / Unblock a user
// router.put('/:id/block', protect, async (req, res) => {
//     try {
//         const userToBlock = await User.findById(req.params.id);
//         const currentUser = await User.findById(req.user.id);

//         if (!userToBlock || !currentUser) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         if (req.params.id === req.user.id) {
//             return res.status(400).json({ message: 'You cannot block yourself' });
//         }

//         const isBlocked = currentUser.blockedUsers.includes(userToBlock._id);

//         if (isBlocked) {
//             // Unblock
//             currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id.toString() !== userToBlock._id.toString());
//         } else {
//             // Block
//             currentUser.blockedUsers.push(userToBlock._id);
//             // Also force unfollow from both sides
//             currentUser.following = currentUser.following.filter(id => id.toString() !== userToBlock._id.toString());
//             userToBlock.followers = userToBlock.followers.filter(id => id.toString() !== currentUser._id.toString());
//             // And remove from their following list
//             userToBlock.following = userToBlock.following.filter(id => id.toString() !== currentUser._id.toString());
//             currentUser.followers = currentUser.followers.filter(id => id.toString() !== userToBlock._id.toString());
//         }

//         await currentUser.save();
//         await userToBlock.save();

//         req.io.emit('userUpdated', currentUser.toJSON());
//         req.io.emit('userUpdated', userToBlock.toJSON());

//         res.json({ message: 'Block status updated' });

//     } catch (error) {
//         console.error('Block user error:', error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// });


// export default router;








import express from 'express';
import User from '../models/userModel.js';
import Post from '../models/postModel.js';
import Notification from '../models/notificationModel.js';
import Follow from '../models/followModel.js'; // New Relational Model
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Limit 20 for free tier stability)
router.get('/', protect, async (req, res) => {
    try {
        const users = await User.find({})
            .select('name username avatarUrl bio')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        // Fetch following status
        const userIds = users.map(u => u._id);
        const myFollows = await Follow.find({ follower: req.user.id, following: { $in: userIds } });
        const followingIds = new Set(myFollows.map(f => f.following.toString()));

        const validUsers = users.map(user => ({
            ...user,
            id: user._id.toString(),
            isFollowedByCurrentUser: followingIds.has(user._id.toString())
        }));

        res.json(validUsers);
    } catch (error) {
        console.error("Fetch users error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});


// @route   GET /api/users/:id
// @desc    Get user profile by ID - WITH EXPLICIT COUNTS (Crucial Fix)
router.get('/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            // CRITICAL FIX: Explicitly count documents to ensure accuracy.
            // Do NOT rely on the user.followers array length if it's potentially out of sync.
            const stats = await Promise.all([
                // Count how many users follow THIS user (Follower Count)
                Follow.countDocuments({ following: req.params.id }),
                // Count how many users THIS user follows (Following Count)
                Follow.countDocuments({ follower: req.params.id }),
                // Check if current user follows this user
                Follow.exists({ follower: req.user.id, following: req.params.id })
            ]);

            const [followersCount, followingCount, isFollowing] = stats;

            // Return plain object mixed with new stats
            const userObj = user.toObject();
            userObj.id = user._id.toString(); // Ensure ID is string
            userObj.followersCount = followersCount;
            // If the array length is wildly different, maybe use the array length?
            // Actually, let's use the explicit backward query for followers usually, but
            // here we did a reverse query effectively.
            userObj.followingCount = followingCount;
            userObj.isFollowedByCurrentUser = !!isFollowing; // .exists returns object or null

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
// @desc    Update user profile (Name, Bio, Email, Password)
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            user.name = req.body.name || user.name;
            user.username = req.body.username || user.username;
            user.bio = req.body.bio ?? user.bio;
            user.avatarUrl = req.body.avatarUrl === null ? null : req.body.avatarUrl || user.avatarUrl;
            user.bannerUrl = req.body.bannerUrl === null ? null : req.body.bannerUrl || user.bannerUrl;

            // Allow updating email
            if (req.body.email) {
                user.email = req.body.email;
            }

            // Allow updating password
            if (req.body.password) {
                user.password = req.body.password; // Will be hashed by pre-save hook in model
            }

            const updatedUser = await user.save();

            // Don't send password back
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
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await Post.deleteMany({ user: req.user.id });

        await User.updateMany(
            { $or: [{ followers: req.user.id }, { following: req.user.id }, { blockedUsers: req.user.id }] },
            { $pull: { followers: req.user.id, following: req.user.id, blockedUsers: req.user.id } }
        );

        await user.deleteOne();
        res.json({ message: 'User account deleted successfully.' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// @route   PUT /api/users/:id/follow
// @desc    Follow / Unfollow a user (Dual Write: Arrays + Collection)
router.put('/:id/follow', protect, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToFollow || !currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.params.id === req.user.id) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        // Check if already following (Phase 1: Check Follow Collection first, fallback to array if in transition? 
        // Actually, let's trust the Array for now as source of truth for "isFollowing" in this function to be safe, 
        // OR check the new collection. We want to be consistent. 
        // For Phase 1, we check the legacy array to decide toggle state, but sync both.)
        // Check if already following using the Follow collection source of truth
        const existingFollow = await Follow.findOne({ follower: currentUser._id, following: userToFollow._id });

        if (existingFollow) {
            // Unfollow
            // 1. Remove from Follow Collection
            await Follow.deleteOne({ _id: existingFollow._id });

            // 2. Update Counters
            currentUser.followingCount = Math.max(0, (currentUser.followingCount || 0) - 1);
            userToFollow.followersCount = Math.max(0, (userToFollow.followersCount || 0) - 1);

            // Delete the corresponding follow notification
            await Notification.deleteOne({
                recipient: userToFollow._id,
                sender: currentUser._id,
                type: 'follow'
            });
        } else {
            // Follow
            // 1. Create in Follow Collection
            try {
                await Follow.create({ follower: currentUser._id, following: userToFollow._id });
            } catch (err) {
                // Ignore duplicate key error if it happens during race conditions
                if (err.code !== 11000) console.error("Follow creation error", err);
            }

            // 2. Update Counters
            currentUser.followingCount = (currentUser.followingCount || 0) + 1;
            userToFollow.followersCount = (userToFollow.followersCount || 0) + 1;

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

        await currentUser.save();
        await userToFollow.save();

        req.io.emit('userUpdated', currentUser.toJSON());
        req.io.emit('userUpdated', userToFollow.toJSON());

        res.json({ message: 'Follow status updated' });

    } catch (error) {
        console.log(error);
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
            // Also force unfollow from both sides
            currentUser.following = currentUser.following.filter(id => id.toString() !== userToBlock._id.toString());
            userToBlock.followers = userToBlock.followers.filter(id => id.toString() !== currentUser._id.toString());
            // And remove from their following list
            userToBlock.following = userToBlock.following.filter(id => id.toString() !== currentUser._id.toString());
            currentUser.followers = currentUser.followers.filter(id => id.toString() !== userToBlock._id.toString());
        }

        await currentUser.save();
        await userToBlock.save();

        req.io.emit('userUpdated', currentUser.toJSON());
        req.io.emit('userUpdated', userToBlock.toJSON());

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

        // Check if the target user is actually following the current user
        const followRel = await Follow.findOne({ follower: userToRemove._id, following: currentUser._id });

        if (followRel) {
            // Remove from Follow Collection
            await Follow.deleteOne({ _id: followRel._id });

            // Update Counters
            currentUser.followersCount = Math.max(0, (currentUser.followersCount || 0) - 1);
            userToRemove.followingCount = Math.max(0, (userToRemove.followingCount || 0) - 1);

            await currentUser.save();
            await userToRemove.save();

            req.io.emit('userUpdated', currentUser.toJSON());
            req.io.emit('userUpdated', userToRemove.toJSON());

            res.json({ message: 'Follower removed successfully' });
        } else {
            res.status(400).json({ message: 'User is not following you' });
        }

    } catch (error) {
        console.error('Remove follower error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
