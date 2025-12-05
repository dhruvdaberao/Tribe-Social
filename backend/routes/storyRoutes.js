

// import express from 'express';
// import protect from '../middleware/authMiddleware.js';
// import Story from '../models/storyModel.js';
// import User from '../models/userModel.js';
// import Notification from '../models/notificationModel.js';

// const router = express.Router();

// // @route   POST /api/stories
// // @desc    Create a new story
// router.post('/', protect, async (req, res) => {
//     const { imageUrl, text, textPosition, imagePosition } = req.body;

//     if (!imageUrl && !text) {
//         return res.status(400).json({ message: 'Story must have an image or text.' });
//     }

//     try {
//         const story = new Story({
//             user: req.user.id,
//             imageUrl,
//             text,
//             textPosition,
//             imagePosition,
//         });

//         const createdStory = await story.save();
//         const populatedStory = await createdStory.populate('user', 'name username avatarUrl');
//         res.status(201).json(populatedStory);
//     } catch (error) {
//         console.error('Error creating story:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // @route   GET /api/stories/my-stories
// // @desc    Get current user's active stories
// router.get('/my-stories', protect, async (req, res) => {
//     try {
//         const stories = await Story.find({ user: req.user.id })
//             .populate('user', 'name username avatarUrl')
//             .sort({ createdAt: 'asc' });
//         res.json(stories);
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // @route   GET /api/stories/feed
// // @desc    Get stories from users the current user is following
// router.get('/feed', protect, async (req, res) => {
//     try {
//         const currentUser = await User.findById(req.user.id);
//         const followingIds = currentUser.following;

//         const stories = await Story.find({ user: { $in: followingIds } })
//             .populate('user', 'name username avatarUrl')
//             .sort({ 'user': 1, createdAt: 'asc' });

//         // Group stories by user
//         const groupedStories = stories.reduce((acc, story) => {
//             const userId = story.user.id.toString();
//             if (!acc[userId]) {
//                 acc[userId] = { user: story.user, stories: [] };
//             }
//             acc[userId].stories.push(story);
//             return acc;
//         }, {});
        
//         res.json(Object.values(groupedStories));
//     } catch (error) {
//         console.error("Error fetching story feed:", error);
//         res.status(500).json({ message: 'Server error' });
//     }
// });


// // @route   DELETE /api/stories/:id
// // @desc    Delete a story
// router.delete('/:id', protect, async (req, res) => {
//     try {
//         const story = await Story.findById(req.params.id);

//         if (!story) {
//             return res.status(404).json({ message: 'Story not found' });
//         }

//         if (story.user.toString() !== req.user.id) {
//             return res.status(401).json({ message: 'User not authorized to delete this story' });
//         }

//         await story.deleteOne();
//         res.json({ message: 'Story deleted' });
//     } catch (error) {
//         console.error('Error deleting story:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // @route   PUT /api/stories/:id/like
// // @desc    Like or unlike a story
// router.put('/:id/like', protect, async (req, res) => {
//     try {
//         let story = await Story.findById(req.params.id);
//         if (!story) {
//             return res.status(404).json({ message: 'Story not found' });
//         }

//         const isLiked = story.likes.some(like => like.equals(req.user.id));
//         if (isLiked) {
//             story.likes = story.likes.filter(like => !like.equals(req.user.id));
//         } else {
//             story.likes.push(req.user.id);
//             if (story.user.toString() !== req.user.id) {
//                 const existingNotification = await Notification.findOne({
//                    recipient: story.user,
//                    sender: req.user.id,
//                    type: 'story_like',
//                    storyId: story._id,
//                 });
//                 if (!existingNotification) {
//                     const notification = new Notification({
//                         recipient: story.user,
//                         sender: req.user.id,
//                         type: 'story_like',
//                         storyId: story._id,
//                     });
//                     await notification.save();
//                     const populatedNotification = await notification.populate('sender', 'name username avatarUrl');
//                     const recipientSocket = req.onlineUsers.get(story.user.toString());
//                     if (recipientSocket) {
//                         req.io.to(recipientSocket).emit('newNotification', populatedNotification);
//                     }
//                 }
//             }
//         }
//         await story.save();
//         res.json(story);
//     } catch (error) {
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// export default router;




import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Story from '../models/storyModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';

const router = express.Router();

// @route   POST /api/stories
// @desc    Create a new story
router.post('/', protect, async (req, res) => {
    const { imageUrl, text, textPosition, imagePosition } = req.body;

    if (!imageUrl && !text) {
        return res.status(400).json({ message: 'Story must have an image or text.' });
    }

    try {
        const story = new Story({
            user: req.user.id,
            imageUrl,
            text,
            textPosition,
            imagePosition,
        });

        const createdStory = await story.save();
        const populatedStory = await createdStory.populate('user', 'name username avatarUrl');
        res.status(201).json(populatedStory);
    } catch (error) {
        console.error('Error creating story:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/stories/my-stories
// @desc    Get current user's active stories
router.get('/my-stories', protect, async (req, res) => {
    try {
        const stories = await Story.find({ user: req.user.id })
            .populate('user', 'name username avatarUrl')
            .sort({ createdAt: 'asc' });
        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/stories/feed
// @desc    Get stories from users the current user is following
router.get('/feed', protect, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const followingIds = currentUser.following;

        const stories = await Story.find({ user: { $in: followingIds } })
            .populate('user', 'name username avatarUrl')
            .sort({ 'user': 1, createdAt: 'asc' });

        // Group stories by user
        const groupedStories = stories.reduce((acc, story) => {
            const userId = story.user.id.toString();
            if (!acc[userId]) {
                acc[userId] = { user: story.user, stories: [] };
            }
            acc[userId].stories.push(story);
            return acc;
        }, {});
        
        res.json(Object.values(groupedStories));
    } catch (error) {
        console.error("Error fetching story feed:", error);
        res.status(500).json({ message: 'Server error' });
    }
});


// @route   DELETE /api/stories/:id
// @desc    Delete a story
router.delete('/:id', protect, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        if (story.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized to delete this story' });
        }

        await story.deleteOne();
        res.json({ message: 'Story deleted' });
    } catch (error) {
        console.error('Error deleting story:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/stories/:id/like
// @desc    Like or unlike a story
router.put('/:id/like', protect, async (req, res) => {
    try {
        let story = await Story.findById(req.params.id);
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        const isLiked = story.likes.some(like => like.equals(req.user.id));
        if (isLiked) {
            story.likes = story.likes.filter(like => !like.equals(req.user.id));
        } else {
            story.likes.push(req.user.id);
            if (story.user.toString() !== req.user.id) {
                const existingNotification = await Notification.findOne({
                   recipient: story.user,
                   sender: req.user.id,
                   type: 'story_like',
                   storyId: story._id,
                });
                if (!existingNotification) {
                    const notification = new Notification({
                        recipient: story.user,
                        sender: req.user.id,
                        type: 'story_like',
                        storyId: story._id,
                    });
                    await notification.save();
                    const populatedNotification = await notification.populate('sender', 'name username avatarUrl');
                    const recipientSocket = req.onlineUsers.get(story.user.toString());
                    if (recipientSocket) {
                        req.io.to(recipientSocket).emit('newNotification', populatedNotification);
                    }
                }
            }
        }
        await story.save();
        res.json(story);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;