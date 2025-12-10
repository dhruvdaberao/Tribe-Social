



// import express from 'express';
// import mongoose from 'mongoose';
// import protect from '../middleware/authMiddleware.js';
// import Post from '../models/postModel.js';
// import User from '../models/userModel.js';
// import Notification from '../models/notificationModel.js';

// const router = express.Router();

// const fullyPopulatePost = async (post) => {
//     await post.populate('user', 'name username avatarUrl');
//     await post.populate('comments.user', 'name username avatarUrl');
//     return post;
// };

// // @route   GET /api/posts/feed
// // @desc    Get posts for feed - Optimized for Free Tier
// router.get('/feed', protect, async (req, res) => {
//     try {
//         const currentUser = await User.findById(req.user.id);
//         if (!currentUser) {
//             return res.status(401).json({ message: "User not found." });
//         }
        
//         // Filter out any invalid ObjectIds from the following list to prevent crashes
//         const followingIds = (currentUser.following || []).filter(id => mongoose.Types.ObjectId.isValid(id));
//         const userIdsForFeed = [currentUser._id, ...followingIds];
        
//         // Use simple .find() instead of aggregate to avoid memory limits on free tier
//         // Limit to 10 posts initially to ensure speed
//         const posts = await Post.find({ user: { $in: userIdsForFeed } })
//             .sort({ createdAt: -1 })
//             .limit(10)
//             .populate('user', 'name username avatarUrl')
//             .populate('comments.user', 'name username avatarUrl');

//         // Robustly format posts, handling cases where users might be deleted (null)
//         // CRITICAL FIX: Only return posts where post.user is NOT null.
//         const validPosts = posts.filter(post => post.user !== null).map(post => {
//             const postObj = post.toJSON();
//             // Filter comments from deleted users
//             postObj.comments = postObj.comments.filter(c => c.user !== null);
//             return postObj;
//         });

//         res.json(validPosts);

//     } catch (error) {
//         console.error("Error in /api/posts/feed route:", error);
//         // Return empty array instead of 500 to keep app running
//         res.json([]); 
//     }
// });


// // @route   GET /api/posts
// // @desc    Get all posts for discover - Optimized
// router.get('/', protect, async (req, res) => {
//     try {
//         // Limit to 20 posts to prevent 502 Bad Gateway (OOM)
//         const posts = await Post.find({})
//             .sort({ createdAt: -1 })
//             .limit(20)
//             .populate('user', 'name username avatarUrl')
//             .populate('comments.user', 'name username avatarUrl');
        
//         const validPosts = posts.filter(post => post.user !== null).map(post => {
//             const postObj = post.toJSON();
//             postObj.comments = postObj.comments.filter(c => c.user !== null);
//             return postObj;
//         });
        
//         res.json(validPosts);
        
//     } catch (error) {
//         console.error("Discover posts route error:", error);
//         res.json([]);
//     }
// });

// // @route   GET /api/posts/:id
// router.get('/:id', protect, async (req, res) => {
//     try {
//         let post = await Post.findById(req.params.id);
//         if (!post) {
//             return res.status(404).json({ message: 'Post not found' });
//         }
//         post = await fullyPopulatePost(post);
//         res.json(post);
//     } catch (error) {
//         res.status(500).json({ message: 'Server Error' });
//     }
// });


// // @route   POST /api/posts
// router.post('/', protect, async (req, res) => {
//     const { content, imageUrl, tempId } = req.body;
//     if (!content && !imageUrl) {
//         return res.status(400).json({ message: 'Post must have content or an image' });
//     }
//     try {
//         const post = new Post({
//             content: content || '',
//             imageUrl: imageUrl || null,
//             user: req.user.id,
//         });

//         let createdPost = await post.save();
//         createdPost = await fullyPopulatePost(createdPost);
        
//         const postForSocket = { ...createdPost.toJSON(), tempId };
//         req.io.emit('newPost', postForSocket);

//         res.status(201).json(createdPost);
//     } catch (error) {
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// // @route   DELETE /api/posts/:id
// router.delete('/:id', protect, async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id);
//         if (!post) {
//             return res.status(404).json({ message: 'Post not found' });
//         }
//         // Allow if user is owner OR admin (for future use)
//         if (post.user.toString() !== req.user.id) {
//             return res.status(401).json({ message: 'User not authorized' });
//         }
//         await post.deleteOne();
//         req.io.emit('postDeleted', req.params.id);
//         res.json({ message: 'Post removed' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// });


// // @route   PUT /api/posts/:id/like
// router.put('/:id/like', protect, async (req, res) => {
//     try {
//         let post = await Post.findById(req.params.id);
//         if (!post) return res.status(404).json({ message: 'Post not found' });

//         const isLiked = post.likes.some(like => like.equals(req.user.id));
//         if (isLiked) {
//             post.likes = post.likes.filter(like => !like.equals(req.user.id));
//         } else {
//             post.likes.push(req.user.id);
//             if (post.user.toString() !== req.user.id) {
//                 const existingNotification = await Notification.findOne({
//                    recipient: post.user,
//                    sender: req.user.id,
//                    type: 'like',
//                    postId: post._id,
//                 });
//                 if (!existingNotification) {
//                     const notification = new Notification({
//                         recipient: post.user,
//                         sender: req.user.id,
//                         type: 'like',
//                         postId: post._id,
//                     });
//                     await notification.save();
//                     const populatedNotification = await notification.populate('sender', 'name username avatarUrl');
//                     const recipientSocket = req.onlineUsers.get(post.user.toString());
//                     if (recipientSocket) {
//                         req.io.to(recipientSocket).emit('newNotification', populatedNotification);
//                     }
//                 }
//             }
//         }

//         await post.save();
//         // Return light payload
//         res.json({ id: post._id, likes: post.likes });
//     } catch (error) {
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// // @route   POST /api/posts/:id/comments
// router.post('/:id/comments', protect, async (req, res) => {
//     const { text } = req.body;
//      if (!text) return res.status(400).json({ message: 'Comment text is required' });
//     try {
//         let post = await Post.findById(req.params.id);
//         if (!post) return res.status(404).json({ message: 'Post not found' });

//         const newComment = { text, user: req.user.id };
//         post.comments.push(newComment);
        
//         if (post.user.toString() !== req.user.id) {
//             const recentNotification = await Notification.findOne({
//                 recipient: post.user,
//                 sender: req.user.id,
//                 type: 'comment',
//                 postId: post._id,
//                 createdAt: { $gte: new Date(Date.now() - 10000) } 
//             });

//             if (!recentNotification) {
//                  const notification = new Notification({
//                     recipient: post.user,
//                     sender: req.user.id,
//                     type: 'comment',
//                     postId: post._id,
//                 });
//                 await notification.save();
//                 const populatedNotification = await notification.populate('sender', 'name username avatarUrl');
//                 const recipientSocket = req.onlineUsers.get(post.user.toString());
//                 if (recipientSocket) {
//                     req.io.to(recipientSocket).emit('newNotification', populatedNotification);
//                 }
//             }
//         }
        
//         let updatedPost = await post.save();
//         updatedPost = await fullyPopulatePost(updatedPost);
//         req.io.emit('postUpdated', updatedPost);
//         res.status(201).json(updatedPost);
//     } catch (error) {
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// // @route   DELETE /api/posts/:id/comments/:comment_id
// router.delete('/:id/comments/:comment_id', protect, async (req, res) => {
//     try {
//         let post = await Post.findById(req.params.id);
//         if (!post) return res.status(404).json({ message: 'Post not found' });

//         const comment = post.comments.find(c => c._id.toString() === req.params.comment_id);
//         if (!comment) return res.status(404).json({ message: 'Comment does not exist' });

//         if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id) {
//             return res.status(401).json({ message: 'User not authorized' });
//         }

//         post.comments = post.comments.filter(c => c._id.toString() !== req.params.comment_id);
        
//         let updatedPost = await post.save();
//         updatedPost = await fullyPopulatePost(updatedPost);
//         req.io.emit('postUpdated', updatedPost);
//         res.json(updatedPost);
//     } catch (error) {
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// export default router;










import express from 'express';
import mongoose from 'mongoose';
import protect from '../middleware/authMiddleware.js';
import Post from '../models/postModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';

const router = express.Router();

const fullyPopulatePost = async (post) => {
    await post.populate('user', 'name username avatarUrl');
    await post.populate('comments.user', 'name username avatarUrl');
    return post;
};

// @route   GET /api/posts/feed
// @desc    Get posts for feed - Optimized with Cursor Pagination
router.get('/feed', protect, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return res.status(401).json({ message: "User not found." });
        }
        
        const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Hard cap at 50
        const lastCreatedAt = req.query.lastCreatedAt;

        // Filter out any invalid ObjectIds from the following list to prevent crashes
        const followingIds = (currentUser.following || []).filter(id => mongoose.Types.ObjectId.isValid(id));
        const userIdsForFeed = [currentUser._id, ...followingIds];
        
        const query = { user: { $in: userIdsForFeed } };
        
        if (lastCreatedAt) {
            query.createdAt = { $lt: new Date(lastCreatedAt) };
        }

        // Use lean() for performance and select specific fields
        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('user', 'name username avatarUrl')
            .populate('comments.user', 'name username avatarUrl')
            .lean();

        // Robustly format posts, handling cases where users might be deleted (null)
        const validPosts = posts.filter(post => post.user !== null).map(post => {
            const postObj = { ...post, id: post._id.toString() };
            // Filter comments from deleted users
            postObj.comments = (postObj.comments || []).filter(c => c.user !== null).map(c => ({...c, id: c._id.toString()}));
            delete postObj._id;
            delete postObj.__v;
            return postObj;
        });

        res.json(validPosts);

    } catch (error) {
        console.error("Error in /api/posts/feed route:", error);
        // Return empty array instead of 500 to keep app running
        res.json([]); 
    }
});


// @route   GET /api/posts
// @desc    Get all posts for discover - Optimized
router.get('/', protect, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const lastCreatedAt = req.query.lastCreatedAt;
        
        const query = {};
        if (lastCreatedAt) {
            query.createdAt = { $lt: new Date(lastCreatedAt) };
        }

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('user', 'name username avatarUrl')
            .populate('comments.user', 'name username avatarUrl')
            .lean();
        
        const validPosts = posts.filter(post => post.user !== null).map(post => {
            const postObj = { ...post, id: post._id.toString() };
            postObj.comments = (postObj.comments || []).filter(c => c.user !== null).map(c => ({...c, id: c._id.toString()}));
            delete postObj._id;
            delete postObj.__v;
            return postObj;
        });
        
        res.json(validPosts);
        
    } catch (error) {
        console.error("Discover posts route error:", error);
        res.json([]);
    }
});

// @route   GET /api/posts/:id
router.get('/:id', protect, async (req, res) => {
    try {
        let post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        post = await fullyPopulatePost(post);
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// @route   POST /api/posts
router.post('/', protect, async (req, res) => {
    const { content, imageUrl, tempId } = req.body;
    if (!content && !imageUrl) {
        return res.status(400).json({ message: 'Post must have content or an image' });
    }
    try {
        const post = new Post({
            content: content || '',
            imageUrl: imageUrl || null,
            user: req.user.id,
        });

        let createdPost = await post.save();
        createdPost = await fullyPopulatePost(createdPost);
        
        const postForSocket = { ...createdPost.toJSON(), tempId };
        req.io.emit('newPost', postForSocket);

        res.status(201).json(createdPost);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/posts/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        // Allow if user is owner OR admin (for future use)
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }
        await post.deleteOne();
        req.io.emit('postDeleted', req.params.id);
        res.json({ message: 'Post removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});


// @route   PUT /api/posts/:id/like
router.put('/:id/like', protect, async (req, res) => {
    try {
        let post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const isLiked = post.likes.some(like => like.equals(req.user.id));
        if (isLiked) {
            post.likes = post.likes.filter(like => !like.equals(req.user.id));
        } else {
            post.likes.push(req.user.id);
            if (post.user.toString() !== req.user.id) {
                const existingNotification = await Notification.findOne({
                   recipient: post.user,
                   sender: req.user.id,
                   type: 'like',
                   postId: post._id,
                });
                if (!existingNotification) {
                    const notification = new Notification({
                        recipient: post.user,
                        sender: req.user.id,
                        type: 'like',
                        postId: post._id,
                    });
                    await notification.save();
                    const populatedNotification = await notification.populate('sender', 'name username avatarUrl');
                    const recipientSocket = req.onlineUsers.get(post.user.toString());
                    if (recipientSocket) {
                        req.io.to(recipientSocket).emit('newNotification', populatedNotification);
                    }
                }
            }
        }

        await post.save();
        // Return light payload
        res.json({ id: post._id, likes: post.likes });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/posts/:id/comments
router.post('/:id/comments', protect, async (req, res) => {
    const { text } = req.body;
     if (!text) return res.status(400).json({ message: 'Comment text is required' });
    try {
        let post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const newComment = { text, user: req.user.id };
        post.comments.push(newComment);
        
        if (post.user.toString() !== req.user.id) {
            const recentNotification = await Notification.findOne({
                recipient: post.user,
                sender: req.user.id,
                type: 'comment',
                postId: post._id,
                createdAt: { $gte: new Date(Date.now() - 10000) } 
            });

            if (!recentNotification) {
                 const notification = new Notification({
                    recipient: post.user,
                    sender: req.user.id,
                    type: 'comment',
                    postId: post._id,
                });
                await notification.save();
                const populatedNotification = await notification.populate('sender', 'name username avatarUrl');
                const recipientSocket = req.onlineUsers.get(post.user.toString());
                if (recipientSocket) {
                    req.io.to(recipientSocket).emit('newNotification', populatedNotification);
                }
            }
        }
        
        let updatedPost = await post.save();
        updatedPost = await fullyPopulatePost(updatedPost);
        req.io.emit('postUpdated', updatedPost);
        res.status(201).json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/posts/:id/comments/:comment_id
router.delete('/:id/comments/:comment_id', protect, async (req, res) => {
    try {
        let post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = post.comments.find(c => c._id.toString() === req.params.comment_id);
        if (!comment) return res.status(404).json({ message: 'Comment does not exist' });

        if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        post.comments = post.comments.filter(c => c._id.toString() !== req.params.comment_id);
        
        let updatedPost = await post.save();
        updatedPost = await fullyPopulatePost(updatedPost);
        req.io.emit('postUpdated', updatedPost);
        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
