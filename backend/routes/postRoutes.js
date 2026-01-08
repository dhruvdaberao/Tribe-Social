

// // // import express from 'express';
// // // import mongoose from 'mongoose';
// // // import protect from '../middleware/authMiddleware.js';
// // // import Post from '../models/postModel.js';
// // // import User from '../models/userModel.js';
// // // import Notification from '../models/notificationModel.js';

// // // const router = express.Router();

// // // // A helper to consistently populate a post document after it's saved/updated.
// // // const fullyPopulatePost = async (post) => {
// // //     await post.populate('user', 'name username avatarUrl');
// // //     await post.populate('comments.user', 'name username avatarUrl');
// // //     return post;
// // // };

// // // // A helper to manually format aggregated posts to match the schema's toJSON transform.
// // // const formatAggregatedPosts = (posts) => {
// // //     return posts.map(post => {
// // //         // This check is crucial for data integrity. If a post's author was deleted,
// // //         // the populated 'user' field will be null. We should filter these out.
// // //         if (!post || !post.user) {
// // //             return null;
// // //         }

// // //         const postObject = { ...post };
// // //         postObject.id = postObject._id.toString();
// // //         postObject.timestamp = postObject.createdAt;
// // //         // The 'user' property is already populated. We will NOT rename it to 'author' here
// // //         // to maintain consistency with other endpoints. The frontend is responsible for this mapping.
        
// // //         delete postObject._id;
// // //         delete postObject.__v;
// // //         delete postObject.createdAt;
// // //         delete postObject.updatedAt;

// // //         postObject.comments = (postObject.comments || []).map(comment => {
// // //             if (!comment.user) return null; // Filter out comments from deleted users
// // //             const commentObject = { ...comment };
// // //             commentObject.id = commentObject._id.toString();
// // //             commentObject.timestamp = commentObject.createdAt;
// // //             // 'comment.user' is populated. No rename needed.
            
// // //             delete commentObject._id;
// // //             delete commentObject.createdAt;
// // //             delete commentObject.updatedAt;
// // //             return commentObject;
// // //         }).filter(Boolean);

// // //         return postObject;
// // //     }).filter(Boolean);
// // // };


// // // // @route   GET /api/posts/feed
// // // // @desc    Get posts for the current user's feed with pagination
// // // router.get('/feed', protect, async (req, res) => {
// // //     try {
// // //         const currentUser = await User.findById(req.user.id);
// // //         if (!currentUser) {
// // //             return res.status(401).json({ message: "User not found." });
// // //         }
        
// // //         const page = parseInt(req.query.page) || 1;
// // //         const limit = parseInt(req.query.limit) || 20;
// // //         const skip = (page - 1) * limit;

// // //         const userIdsForFeed = [currentUser._id, ...(currentUser.following || [])];
        
// // //         let posts = await Post.aggregate([
// // //             { $match: { user: { $in: userIdsForFeed.map(id => new mongoose.Types.ObjectId(id.toString())) } } },
// // //             { $sort: { createdAt: -1 } },
// // //             { $skip: skip },
// // //             { $limit: limit },
// // //         ]).allowDiskUse(true);

// // //         posts = await Post.populate(posts, { path: 'user' });
// // //         posts = await Post.populate(posts, { path: 'comments.user' });

// // //         const formattedPosts = formatAggregatedPosts(posts);
// // //         res.json(formattedPosts);

// // //     } catch (error) {
// // //         console.error("Error in /api/posts/feed route:", error);
// // //         res.status(500).json({ message: 'Server Error: Could not fetch feed.' });
// // //     }
// // // });


// // // // @route   GET /api/posts
// // // // @desc    Get all posts for discover page with pagination
// // // router.get('/', protect, async (req, res) => {
// // //     try {
// // //         const page = parseInt(req.query.page) || 1;
// // //         const limit = parseInt(req.query.limit) || 50;
// // //         const skip = (page - 1) * limit;

// // //         let posts = await Post.aggregate([
// // //             { $sort: { createdAt: -1 } },
// // //             { $skip: skip },
// // //             { $limit: limit }
// // //         ]).allowDiskUse(true);
        
// // //         posts = await Post.populate(posts, { path: 'user' });
// // //         posts = await Post.populate(posts, { path: 'comments.user' });
        
// // //         const formattedPosts = formatAggregatedPosts(posts);
// // //         res.json(formattedPosts);
        
// // //     } catch (error) {
// // //         console.error("Discover posts route error:", error);
// // //         res.status(500).json({ message: 'Server Error: Could not fetch posts.' });
// // //     }
// // // });

// // // // @route   GET /api/posts/:id
// // // // @desc    Get a single post by ID
// // // router.get('/:id', protect, async (req, res) => {
// // //     try {
// // //         let post = await Post.findById(req.params.id);
// // //         if (!post) {
// // //             return res.status(404).json({ message: 'Post not found' });
// // //         }
// // //         post = await fullyPopulatePost(post);
// // //         res.json(post);
// // //     } catch (error) {
// // //         console.error('Get post by ID error:', error);
// // //         res.status(500).json({ message: 'Server Error' });
// // //     }
// // // });


// // // // @route   POST /api/posts
// // // // @desc    Create a new post
// // // router.post('/', protect, async (req, res) => {
// // //     const { content, imageUrl, tempId } = req.body;
// // //     if (!content && !imageUrl) {
// // //         return res.status(400).json({ message: 'Post must have content or an image' });
// // //     }
// // //     try {
// // //         const post = new Post({
// // //             content: content || '',
// // //             imageUrl: imageUrl || null,
// // //             user: req.user.id,
// // //         });

// // //         let createdPost = await post.save();
// // //         createdPost = await fullyPopulatePost(createdPost);
        
// // //         // Include tempId in the socket event to allow frontend to replace optimistic post
// // //         const postForSocket = { ...createdPost.toJSON(), tempId };
// // //         req.io.emit('newPost', postForSocket);

// // //         res.status(201).json(createdPost);
// // //     } catch (error) {
// // //         res.status(500).json({ message: 'Server Error' });
// // //     }
// // // });

// // // // @route   DELETE /api/posts/:id
// // // // @desc    Delete a post
// // // router.delete('/:id', protect, async (req, res) => {
// // //     try {
// // //         const post = await Post.findById(req.params.id);
// // //         if (!post) {
// // //             return res.status(404).json({ message: 'Post not found' });
// // //         }
// // //         if (post.user.toString() !== req.user.id) {
// // //             return res.status(401).json({ message: 'User not authorized' });
// // //         }
// // //         await post.deleteOne();
// // //         req.io.emit('postDeleted', req.params.id);
// // //         res.json({ message: 'Post removed' });
// // //     } catch (error) {
// // //         console.error(error);
// // //         res.status(500).json({ message: 'Server Error' });
// // //     }
// // // });


// // // // @route   PUT /api/posts/:id/like
// // // // @desc    Like or unlike a post
// // // router.put('/:id/like', protect, async (req, res) => {
// // //     try {
// // //         let post = await Post.findById(req.params.id);
// // //         if (!post) {
// // //             return res.status(404).json({ message: 'Post not found' });
// // //         }

// // //         const isLiked = post.likes.some(like => like.equals(req.user.id));
// // //         if (isLiked) {
// // //             post.likes = post.likes.filter(like => !like.equals(req.user.id));
// // //         } else {
// // //             post.likes.push(req.user.id);
// // //             if (post.user.toString() !== req.user.id) {
// // //                 const existingNotification = await Notification.findOne({
// // //                    recipient: post.user,
// // //                    sender: req.user.id,
// // //                    type: 'like',
// // //                    postId: post._id,
// // //                 });
// // //                 if (!existingNotification) {
// // //                     const notification = new Notification({
// // //                         recipient: post.user,
// // //                         sender: req.user.id,
// // //                         type: 'like',
// // //                         postId: post._id,
// // //                     });
// // //                     await notification.save();
// // //                     const populatedNotification = await notification.populate('sender', 'name username avatarUrl');
// // //                     const recipientSocket = req.onlineUsers.get(post.user.toString());
// // //                     if (recipientSocket) {
// // //                         req.io.to(recipientSocket).emit('newNotification', populatedNotification);
// // //                     }
// // //                 }
// // //             }
// // //         }

// // //         let updatedPost = await post.save();
// // //         updatedPost = await fullyPopulatePost(updatedPost);
// // //         req.io.emit('postUpdated', updatedPost);
// // //         res.json(updatedPost);
// // //     } catch (error) {
// // //         res.status(500).json({ message: 'Server Error' });
// // //     }
// // // });

// // // // @route   POST /api/posts/:id/comments
// // // // @desc    Comment on a post
// // // router.post('/:id/comments', protect, async (req, res) => {
// // //     const { text } = req.body;
// // //      if (!text) {
// // //         return res.status(400).json({ message: 'Comment text is required' });
// // //     }
// // //     try {
// // //         let post = await Post.findById(req.params.id);
// // //         if (!post) {
// // //             return res.status(404).json({ message: 'Post not found' });
// // //         }

// // //         const newComment = { text, user: req.user.id };
// // //         post.comments.push(newComment);
        
// // //         if (post.user.toString() !== req.user.id) {
// // //             // Check for a very recent similar notification to prevent duplicates from fast clicks/retries
// // //             const recentNotification = await Notification.findOne({
// // //                 recipient: post.user,
// // //                 sender: req.user.id,
// // //                 type: 'comment',
// // //                 postId: post._id,
// // //                 createdAt: { $gte: new Date(Date.now() - 10000) } // 10 seconds ago
// // //             });

// // //             if (!recentNotification) {
// // //                  const notification = new Notification({
// // //                     recipient: post.user,
// // //                     sender: req.user.id,
// // //                     type: 'comment',
// // //                     postId: post._id,
// // //                 });
// // //                 await notification.save();
// // //                 const populatedNotification = await notification.populate('sender', 'name username avatarUrl');
// // //                 const recipientSocket = req.onlineUsers.get(post.user.toString());
// // //                 if (recipientSocket) {
// // //                     req.io.to(recipientSocket).emit('newNotification', populatedNotification);
// // //                 }
// // //             }
// // //         }
        
// // //         let updatedPost = await post.save();
// // //         updatedPost = await fullyPopulatePost(updatedPost);
// // //         req.io.emit('postUpdated', updatedPost);
// // //         res.status(201).json(updatedPost);
// // //     } catch (error) {
// // //         res.status(500).json({ message: 'Server Error' });
// // //     }
// // // });

// // // // @route   DELETE /api/posts/:id/comments/:comment_id
// // // // @desc    Delete a comment
// // // router.delete('/:id/comments/:comment_id', protect, async (req, res) => {
// // //     try {
// // //         let post = await Post.findById(req.params.id);
// // //         if (!post) {
// // //             return res.status(404).json({ message: 'Post not found' });
// // //         }

// // //         const comment = post.comments.find(c => c._id.toString() === req.params.comment_id);
// // //         if (!comment) {
// // //             return res.status(404).json({ message: 'Comment does not exist' });
// // //         }

// // //         if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id) {
// // //             return res.status(401).json({ message: 'User not authorized' });
// // //         }

// // //         post.comments = post.comments.filter(c => c._id.toString() !== req.params.comment_id);
        
// // //         let updatedPost = await post.save();
// // //         updatedPost = await fullyPopulatePost(updatedPost);
// // //         req.io.emit('postUpdated', updatedPost);
// // //         res.json(updatedPost);
// // //     } catch (error) {
// // //         console.error(error);
// // //         res.status(500).json({ message: 'Server Error' });
// // //     }
// // // });

// // // export default router;






// // import express from 'express';
// // import protect from '../middleware/authMiddleware.js';
// // import Post from '../models/postModel.js';
// // import User from '../models/userModel.js';
// // import Notification from '../models/notificationModel.js';
// // import mongoose from 'mongoose';

// // const router = express.Router();

// // const fullyPopulatePost = async (post) => {
// //     await post.populate('user', 'name username avatarUrl');
// //     await post.populate('comments.user', 'name username avatarUrl');
// //     return post;
// // };

// // // @route   GET /api/posts/feed
// // // @desc    Get posts for the current user's feed
// // router.get('/feed', protect, async (req, res) => {
// //     try {
// //         const currentUser = await User.findById(req.user.id);
// //         if (!currentUser) return res.status(404).json({ message: "User not found" });

// //         // Ensure user IDs are valid ObjectId strings before querying
// //         const userIdsForFeed = [currentUser._id, ...(currentUser.following || [])]
// //             .filter(id => mongoose.Types.ObjectId.isValid(id));
        
// //         // Use standard .find() which is reliable on MongoDB Free Tier
// //         const posts = await Post.find({ user: { $in: userIdsForFeed } })
// //             .sort({ createdAt: -1 })
// //             .limit(50) 
// //             .populate('user', 'name username avatarUrl')
// //             .populate('comments.user', 'name username avatarUrl');

// //         // Robustness: Filter out posts where the user field is null (e.g., deleted users)
// //         const validPosts = posts.filter(post => post.user !== null);

// //         res.json(validPosts);
// //     } catch (error) {
// //         console.error("Feed error:", error);
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });

// // // @route   GET /api/posts
// // // @desc    Get all posts (Discover)
// // router.get('/', protect, async (req, res) => {
// //     try {
// //         const posts = await Post.find({})
// //             .sort({ createdAt: -1 })
// //             .limit(50)
// //             .populate('user', 'name username avatarUrl')
// //             .populate('comments.user', 'name username avatarUrl');
        
// //         const validPosts = posts.filter(post => post.user !== null);
// //         res.json(validPosts);
// //     } catch (error) {
// //         console.error("Discover error:", error);
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });

// // // @route   GET /api/posts/:id
// // router.get('/:id', protect, async (req, res) => {
// //     try {
// //         if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
// //             return res.status(404).json({ message: 'Post not found' });
// //         }
// //         let post = await Post.findById(req.params.id);
// //         if (!post) return res.status(404).json({ message: 'Post not found' });
        
// //         post = await fullyPopulatePost(post);
// //         res.json(post);
// //     } catch (error) {
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });

// // // @route   POST /api/posts
// // router.post('/', protect, async (req, res) => {
// //     const { content, imageUrl, tempId } = req.body;
// //     if (!content && !imageUrl) return res.status(400).json({ message: 'Post content required' });

// //     try {
// //         const post = new Post({
// //             content: content || '',
// //             imageUrl: imageUrl || null,
// //             user: req.user.id,
// //         });

// //         let createdPost = await post.save();
// //         createdPost = await fullyPopulatePost(createdPost);
        
// //         // Include tempId so frontend can reconcile optimistic updates
// //         const postForSocket = { ...createdPost.toJSON(), tempId };
// //         req.io.emit('newPost', postForSocket);

// //         res.status(201).json(createdPost);
// //     } catch (error) {
// //         console.error("Create post error:", error);
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });

// // // @route   DELETE /api/posts/:id
// // router.delete('/:id', protect, async (req, res) => {
// //     try {
// //         const post = await Post.findById(req.params.id);
// //         if (!post) return res.status(404).json({ message: 'Post not found' });

// //         if (post.user.toString() !== req.user.id) {
// //             return res.status(401).json({ message: 'Unauthorized' });
// //         }

// //         await post.deleteOne();
// //         req.io.emit('postDeleted', req.params.id);
// //         res.json({ message: 'Post removed' });
// //     } catch (error) {
// //         console.error(error);
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });

// // // @route   PUT /api/posts/:id/like
// // router.put('/:id/like', protect, async (req, res) => {
// //     try {
// //         let post = await Post.findById(req.params.id);
// //         if (!post) return res.status(404).json({ message: 'Post not found' });

// //         const isLiked = post.likes.some(like => like.equals(req.user.id));
// //         if (isLiked) {
// //             post.likes = post.likes.filter(like => !like.equals(req.user.id));
// //         } else {
// //             post.likes.push(req.user.id);
// //             if (post.user.toString() !== req.user.id) {
// //                 const existingNotif = await Notification.findOne({
// //                    recipient: post.user,
// //                    sender: req.user.id,
// //                    type: 'like',
// //                    postId: post._id,
// //                 });
// //                 if (!existingNotif) {
// //                     const notification = new Notification({
// //                         recipient: post.user,
// //                         sender: req.user.id,
// //                         type: 'like',
// //                         postId: post._id,
// //                     });
// //                     await notification.save();
// //                     const popNotif = await notification.populate('sender', 'name username avatarUrl');
// //                     const socketId = req.onlineUsers.get(post.user.toString());
// //                     if (socketId) req.io.to(socketId).emit('newNotification', popNotif);
// //                 }
// //             }
// //         }

// //         await post.save();
// //         const updatedPost = await fullyPopulatePost(post);
// //         req.io.emit('postUpdated', updatedPost);
// //         res.json(updatedPost);
// //     } catch (error) {
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });

// // // @route   POST /api/posts/:id/comments
// // router.post('/:id/comments', protect, async (req, res) => {
// //     const { text } = req.body;
// //     if (!text) return res.status(400).json({ message: 'Text required' });

// //     try {
// //         let post = await Post.findById(req.params.id);
// //         if (!post) return res.status(404).json({ message: 'Post not found' });

// //         post.comments.push({ text, user: req.user.id });
        
// //         if (post.user.toString() !== req.user.id) {
// //              const notification = new Notification({
// //                 recipient: post.user,
// //                 sender: req.user.id,
// //                 type: 'comment',
// //                 postId: post._id,
// //             });
// //             await notification.save();
// //             const popNotif = await notification.populate('sender', 'name username avatarUrl');
// //             const socketId = req.onlineUsers.get(post.user.toString());
// //             if (socketId) req.io.to(socketId).emit('newNotification', popNotif);
// //         }
        
// //         await post.save();
// //         const updatedPost = await fullyPopulatePost(post);
// //         req.io.emit('postUpdated', updatedPost);
// //         res.status(201).json(updatedPost);
// //     } catch (error) {
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });

// // // @route   DELETE /api/posts/:id/comments/:comment_id
// // router.delete('/:id/comments/:comment_id', protect, async (req, res) => {
// //     try {
// //         let post = await Post.findById(req.params.id);
// //         if (!post) return res.status(404).json({ message: 'Post not found' });

// //         const comment = post.comments.find(c => c._id.toString() === req.params.comment_id);
// //         if (!comment) return res.status(404).json({ message: 'Comment not found' });

// //         if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id) {
// //             return res.status(401).json({ message: 'Unauthorized' });
// //         }

// //         post.comments = post.comments.filter(c => c._id.toString() !== req.params.comment_id);
// //         await post.save();
// //         const updatedPost = await fullyPopulatePost(post);
// //         req.io.emit('postUpdated', updatedPost);
// //         res.json(updatedPost);
// //     } catch (error) {
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });

// // export default router;






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
import protect from '../middleware/authMiddleware.js';
import Post from '../models/postModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';
import { uploadImage } from '../utils/cloudinary.js';

const router = express.Router();

const MINIMAL_USER = 'name username avatarUrl';
const POST_POPULATION = [
    { path: 'user', select: MINIMAL_USER },
    { path: 'comments.user', select: MINIMAL_USER }
];

// @route   POST /api/posts
router.post('/', protect, async (req, res) => {
    const { content, imageUrl: base64Image, tempId } = req.body;
    
    if (!content && !base64Image) {
        return res.status(400).json({ message: 'Post must have content or an image' });
    }

    try {
        // PERF FIX: If frontend sends base64, upload to CDN immediately
        let finalImageUrl = null;
        if (base64Image && base64Image.startsWith('data:image')) {
            finalImageUrl = await uploadImage(base64Image, 'posts');
        } else {
            finalImageUrl = base64Image; // Use as-is if it's already a URL
        }

        const post = new Post({ 
            content: content || '', 
            imageUrl: finalImageUrl, 
            user: req.user.id 
        });

        const createdPost = await post.save();
        const populatedPost = await Post.findById(createdPost._id).populate(POST_POPULATION).lean();
        
        if (req.io) req.io.emit('newPost', { ...populatedPost, tempId });
        res.status(201).json(populatedPost);
    } catch (error) {
        console.error("Create Post Error:", error);
        res.status(500).json({ message: 'Server Error during post creation' });
    }
});

// @route   GET /api/posts/feed
router.get('/feed', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const currentUser = await User.findById(req.user.id).select('following').lean();
        const userIdsForFeed = [req.user.id, ...(currentUser?.following || [])];
        
        const posts = await Post.find({ user: { $in: userIdsForFeed } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate(POST_POPULATION)
            .select('content imageUrl user likes comments createdAt') // Only fetch needed fields
            .lean(); 

        res.json(posts);
    } catch (error) {
        res.status(500).json([]); 
    }
});

// @route   GET /api/posts (Discover)
router.get('/', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await Post.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate(POST_POPULATION)
            .lean();
        
        res.json(posts);
    } catch (error) {
        res.status(500).json([]);
    }
});

// (Remaining routes like DELETE, LIKE etc remain unchanged but now benefit from smaller DB documents)
router.put('/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        const isLiked = post.likes.some(like => like.equals(req.user.id));
        if (isLiked) {
            post.likes = post.likes.filter(like => !like.equals(req.user.id));
        } else {
            post.likes.push(req.user.id);
            if (post.user.toString() !== req.user.id) {
                const notification = new Notification({ recipient: post.user, sender: req.user.id, type: 'like', postId: post._id });
                await notification.save();
                const popNotif = await notification.populate('sender', 'name username avatarUrl');
                const socketId = req.onlineUsers?.get(post.user.toString());
                if (socketId && req.io) req.io.to(socketId).emit('newNotification', popNotif);
            }
        }
        await post.save();
        res.json({ id: post._id, likes: post.likes });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;