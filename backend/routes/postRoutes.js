





// import express from 'express';
// import mongoose from 'mongoose';
// import protect from '../middleware/authMiddleware.js';
// import Post from '../models/postModel.js';
// import User from '../models/userModel.js';
// import Notification from '../models/notificationModel.js';

// const router = express.Router();

// // A helper to consistently populate a post document after it's saved/updated.
// const fullyPopulatePost = async (post) => {
//     await post.populate('user', 'name username avatarUrl');
//     await post.populate('comments.user', 'name username avatarUrl');
//     return post;
// };

// // A helper to manually format aggregated posts to match the schema's toJSON transform.
// const formatAggregatedPosts = (posts) => {
//     return posts.map(post => {
//         // This check is crucial for data integrity. If a post's author was deleted,
//         // the populated 'user' field will be null. We should filter these out.
//         if (!post || !post.user) {
//             return null;
//         }

//         const postObject = { ...post };
//         postObject.id = postObject._id.toString();
//         postObject.timestamp = postObject.createdAt;
//         // The 'user' property is already populated. We will NOT rename it to 'author' here
//         // to maintain consistency with other endpoints. The frontend is responsible for this mapping.
        
//         delete postObject._id;
//         delete postObject.__v;
//         delete postObject.createdAt;
//         delete postObject.updatedAt;

//         postObject.comments = (postObject.comments || []).map(comment => {
//             if (!comment.user) return null; // Filter out comments from deleted users
//             const commentObject = { ...comment };
//             commentObject.id = commentObject._id.toString();
//             commentObject.timestamp = commentObject.createdAt;
//             // 'comment.user' is populated. No rename needed.
            
//             delete commentObject._id;
//             delete commentObject.createdAt;
//             delete commentObject.updatedAt;
//             return commentObject;
//         }).filter(Boolean);

//         return postObject;
//     }).filter(Boolean);
// };


// // @route   GET /api/posts/feed
// // @desc    Get posts for the current user's feed with pagination
// router.get('/feed', protect, async (req, res) => {
//     try {
//         const currentUser = await User.findById(req.user.id);
//         if (!currentUser) {
//             return res.status(401).json({ message: "User not found." });
//         }
        
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 20;
//         const skip = (page - 1) * limit;

//         const userIdsForFeed = [currentUser._id, ...(currentUser.following || [])];
        
//         let posts = await Post.aggregate([
//             { $match: { user: { $in: userIdsForFeed.map(id => new mongoose.Types.ObjectId(id.toString())) } } },
//             { $sort: { createdAt: -1 } },
//             { $skip: skip },
//             { $limit: limit },
//         ]).allowDiskUse(true);

//         posts = await Post.populate(posts, { path: 'user' });
//         posts = await Post.populate(posts, { path: 'comments.user' });

//         const formattedPosts = formatAggregatedPosts(posts);
//         res.json(formattedPosts);

//     } catch (error) {
//         console.error("Error in /api/posts/feed route:", error);
//         res.status(500).json({ message: 'Server Error: Could not fetch feed.' });
//     }
// });


// // @route   GET /api/posts
// // @desc    Get all posts for discover page with pagination
// router.get('/', protect, async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 50;
//         const skip = (page - 1) * limit;

//         let posts = await Post.aggregate([
//             { $sort: { createdAt: -1 } },
//             { $skip: skip },
//             { $limit: limit }
//         ]).allowDiskUse(true);
        
//         posts = await Post.populate(posts, { path: 'user' });
//         posts = await Post.populate(posts, { path: 'comments.user' });
        
//         const formattedPosts = formatAggregatedPosts(posts);
//         res.json(formattedPosts);
        
//     } catch (error) {
//         console.error("Discover posts route error:", error);
//         res.status(500).json({ message: 'Server Error: Could not fetch posts.' });
//     }
// });

// // @route   GET /api/posts/:id
// // @desc    Get a single post by ID
// router.get('/:id', protect, async (req, res) => {
//     try {
//         let post = await Post.findById(req.params.id);
//         if (!post) {
//             return res.status(404).json({ message: 'Post not found' });
//         }
//         post = await fullyPopulatePost(post);
//         res.json(post);
//     } catch (error) {
//         console.error('Get post by ID error:', error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// });


// // @route   POST /api/posts
// // @desc    Create a new post
// router.post('/', protect, async (req, res) => {
//     const { content, imageUrl } = req.body;
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
        
//         req.io.emit('newPost', createdPost);
//         res.status(201).json(createdPost);
//     } catch (error) {
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// // @route   DELETE /api/posts/:id
// // @desc    Delete a post
// router.delete('/:id', protect, async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id);
//         if (!post) {
//             return res.status(404).json({ message: 'Post not found' });
//         }
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
// // @desc    Like or unlike a post
// router.put('/:id/like', protect, async (req, res) => {
//     try {
//         let post = await Post.findById(req.params.id);
//         if (!post) {
//             return res.status(404).json({ message: 'Post not found' });
//         }

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

//         let updatedPost = await post.save();
//         updatedPost = await fullyPopulatePost(updatedPost);
//         req.io.emit('postUpdated', updatedPost);
//         res.json(updatedPost);
//     } catch (error) {
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// // @route   POST /api/posts/:id/comments
// // @desc    Comment on a post
// router.post('/:id/comments', protect, async (req, res) => {
//     const { text } = req.body;
//      if (!text) {
//         return res.status(400).json({ message: 'Comment text is required' });
//     }
//     try {
//         let post = await Post.findById(req.params.id);
//         if (!post) {
//             return res.status(404).json({ message: 'Post not found' });
//         }

//         const newComment = { text, user: req.user.id };
//         post.comments.push(newComment);
        
//         if (post.user.toString() !== req.user.id) {
//              const notification = new Notification({
//                 recipient: post.user,
//                 sender: req.user.id,
//                 type: 'comment',
//                 postId: post._id,
//             });
//             await notification.save();
//             const populatedNotification = await notification.populate('sender', 'name username avatarUrl');
//             const recipientSocket = req.onlineUsers.get(post.user.toString());
//             if (recipientSocket) {
//                 req.io.to(recipientSocket).emit('newNotification', populatedNotification);
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
// // @desc    Delete a comment
// router.delete('/:id/comments/:comment_id', protect, async (req, res) => {
//     try {
//         let post = await Post.findById(req.params.id);
//         if (!post) {
//             return res.status(404).json({ message: 'Post not found' });
//         }

//         const comment = post.comments.find(c => c._id.toString() === req.params.comment_id);
//         if (!comment) {
//             return res.status(404).json({ message: 'Comment does not exist' });
//         }

//         if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id) {
//             return res.status(401).json({ message: 'User not authorized' });
//         }

//         post.comments = post.comments.filter(c => c._id.toString() !== req.params.comment_id);
        
//         let updatedPost = await post.save();
//         updatedPost = await fullyPopulatePost(updatedPost);
//         req.io.emit('postUpdated', updatedPost);
//         res.json(updatedPost);
//     } catch (error) {
//         console.error(error);
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

// A helper to consistently populate a post document after it's saved/updated.
const fullyPopulatePost = async (post) => {
    await post.populate('user', 'name username avatarUrl');
    await post.populate('comments.user', 'name username avatarUrl');
    return post;
};

// A helper to manually format aggregated posts to match the schema's toJSON transform.
const formatAggregatedPosts = (posts) => {
    return posts.map(post => {
        // This check is crucial for data integrity. If a post's author was deleted,
        // the populated 'user' field will be null. We should filter these out.
        if (!post || !post.user) {
            return null;
        }

        const postObject = { ...post };
        postObject.id = postObject._id.toString();
        postObject.timestamp = postObject.createdAt;
        // The 'user' property is already populated. We will NOT rename it to 'author' here
        // to maintain consistency with other endpoints. The frontend is responsible for this mapping.
        
        delete postObject._id;
        delete postObject.__v;
        delete postObject.createdAt;
        delete postObject.updatedAt;

        postObject.comments = (postObject.comments || []).map(comment => {
            if (!comment.user) return null; // Filter out comments from deleted users
            const commentObject = { ...comment };
            commentObject.id = commentObject._id.toString();
            commentObject.timestamp = commentObject.createdAt;
            // 'comment.user' is populated. No rename needed.
            
            delete commentObject._id;
            delete commentObject.createdAt;
            delete commentObject.updatedAt;
            return commentObject;
        }).filter(Boolean);

        return postObject;
    }).filter(Boolean);
};


// @route   GET /api/posts/feed
// @desc    Get posts for the current user's feed with pagination
router.get('/feed', protect, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return res.status(401).json({ message: "User not found." });
        }
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const userIdsForFeed = [currentUser._id, ...(currentUser.following || [])];
        
        let posts = await Post.aggregate([
            { $match: { user: { $in: userIdsForFeed.map(id => new mongoose.Types.ObjectId(id.toString())) } } },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]).allowDiskUse(true);

        posts = await Post.populate(posts, { path: 'user' });
        posts = await Post.populate(posts, { path: 'comments.user' });

        const formattedPosts = formatAggregatedPosts(posts);
        res.json(formattedPosts);

    } catch (error) {
        console.error("Error in /api/posts/feed route:", error);
        res.status(500).json({ message: 'Server Error: Could not fetch feed.' });
    }
});


// @route   GET /api/posts
// @desc    Get all posts for discover page with pagination
router.get('/', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        let posts = await Post.aggregate([
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]).allowDiskUse(true);
        
        posts = await Post.populate(posts, { path: 'user' });
        posts = await Post.populate(posts, { path: 'comments.user' });
        
        const formattedPosts = formatAggregatedPosts(posts);
        res.json(formattedPosts);
        
    } catch (error) {
        console.error("Discover posts route error:", error);
        res.status(500).json({ message: 'Server Error: Could not fetch posts.' });
    }
});

// @route   GET /api/posts/:id
// @desc    Get a single post by ID
router.get('/:id', protect, async (req, res) => {
    try {
        let post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        post = await fullyPopulatePost(post);
        res.json(post);
    } catch (error) {
        console.error('Get post by ID error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});


// @route   POST /api/posts
// @desc    Create a new post
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
        
        // Include tempId in the socket event to allow frontend to replace optimistic post
        const postForSocket = { ...createdPost.toJSON(), tempId };
        req.io.emit('newPost', postForSocket);

        res.status(201).json(createdPost);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
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
// @desc    Like or unlike a post
router.put('/:id/like', protect, async (req, res) => {
    try {
        let post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

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

        let updatedPost = await post.save();
        updatedPost = await fullyPopulatePost(updatedPost);
        req.io.emit('postUpdated', updatedPost);
        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/posts/:id/comments
// @desc    Comment on a post
router.post('/:id/comments', protect, async (req, res) => {
    const { text } = req.body;
     if (!text) {
        return res.status(400).json({ message: 'Comment text is required' });
    }
    try {
        let post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment = { text, user: req.user.id };
        post.comments.push(newComment);
        
        if (post.user.toString() !== req.user.id) {
            // Check for a very recent similar notification to prevent duplicates from fast clicks/retries
            const recentNotification = await Notification.findOne({
                recipient: post.user,
                sender: req.user.id,
                type: 'comment',
                postId: post._id,
                createdAt: { $gte: new Date(Date.now() - 10000) } // 10 seconds ago
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
// @desc    Delete a comment
router.delete('/:id/comments/:comment_id', protect, async (req, res) => {
    try {
        let post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = post.comments.find(c => c._id.toString() === req.params.comment_id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment does not exist' });
        }

        if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        post.comments = post.comments.filter(c => c._id.toString() !== req.params.comment_id);
        
        let updatedPost = await post.save();
        updatedPost = await fullyPopulatePost(updatedPost);
        req.io.emit('postUpdated', updatedPost);
        res.json(updatedPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;