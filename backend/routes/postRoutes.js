
import express from 'express';
import mongoose from 'mongoose';
import protect from '../middleware/authMiddleware.js';
import Post from '../models/postModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';
import Like from '../models/likeModel.js';
import Comment from '../models/commentModel.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

const fullyPopulatePost = async (post) => {
    await post.populate('user', 'name username avatarUrl');
    await post.populate('comments.user', 'name username avatarUrl');
    return post;
};

// @route   GET /api/posts/feed
// @desc    Get posts for feed - Scalable & Optimized
router.get('/feed', protect, async (req, res) => {
    try {
        console.log("----------------------------------");
        console.log(`🔍 GET /api/posts/feed - User: ${req.user.id}`);

        const currentUser = await User.findById(req.user.id);
        if (!currentUser) return res.status(401).json({ message: "User not found." });

        // Get following list from Follow collection (Scalable)
        const { default: Follow } = await import('../models/followModel.js');
        const followingDocs = await Follow.find({ follower: currentUser._id }).select('following');
        const followingIds = followingDocs.map(f => f.following);
        const userIdsForFeed = [currentUser._id, ...followingIds];

        console.log(`📋 Feed for users: ${userIdsForFeed.length}`);

        // Fetch Posts (Paginated)
        // Don't populate arrays from DB
        let posts = await Post.find({ user: { $in: userIdsForFeed } })
            .select('-likes -comments') // Exclude heavy arrays
            .sort({ createdAt: -1 })
            .skip(((parseInt(req.query.page) || 1) - 1) * (parseInt(req.query.limit) || 20))
            .limit(parseInt(req.query.limit) || 20)
            .populate('user', 'name username avatarUrl');

        console.log(`✅ Personalized feed found: ${posts.length} posts`);

        if (posts.length === 0) {
            console.log("⚠️ Feed empty. Fetching global posts...");
            posts = await Post.find({})
                .select('-likes -comments')
                .sort({ createdAt: -1 })
                .skip(((parseInt(req.query.page) || 1) - 1) * (parseInt(req.query.limit) || 20))
                .limit(parseInt(req.query.limit) || 20)
                .populate('user', 'name username avatarUrl');
        }

        // Hydrate Posts with Likes (Is Liked?) and Comments (Recent)
        const { default: Like } = await import('../models/likeModel.js');
        const { default: Comment } = await import('../models/commentModel.js');

        // 1. Bulk check "Is Liked"
        const postIds = posts.map(p => p._id);
        const myLikes = await Like.find({ user: req.user.id, post: { $in: postIds } });
        const myLikedPostIds = new Set(myLikes.map(l => l.post.toString()));

        // 2. Fetch Recent Comments (Parallel)
        const postsWithData = await Promise.all(posts.map(async (post) => {
            const postObj = post.toJSON();

            // Reconstruct lightweight 'likes' array for frontend compatibility check (includes(me))
            postObj.likes = myLikedPostIds.has(post._id.toString()) ? [req.user.id] : [];

            // Counts (Should be on model, fallback to 0)
            postObj.likesCount = post.likesCount || 0;
            postObj.commentsCount = post.commentsCount || 0;

            // Fetch recent 3 comments
            const recentComments = await Comment.find({ post: post._id })
                .sort({ createdAt: -1 })
                .limit(3)
                .populate('user', 'name username avatarUrl');

            postObj.comments = recentComments;

            return postObj;
        }));

        const validPosts = postsWithData.filter(post => post.user !== null);
        console.log(`📤 Returning ${validPosts.length} posts.`);
        res.json(validPosts);

    } catch (error) {
        console.error("❌ Error in /api/posts/feed route:", error);
        res.json([]);
    }
});


// @route   GET /api/posts
// @desc    Get all posts for discover - Scalable
router.get('/', protect, async (req, res) => {
    try {
        console.log("----------------------------------");
        console.log("🔍 GET /api/posts - Fetching Discover feed");

        let posts = await Post.find({})
            .select('-likes -comments')
            .sort({ createdAt: -1 })
            .skip(((parseInt(req.query.page) || 1) - 1) * (parseInt(req.query.limit) || 50))
            .limit(parseInt(req.query.limit) || 50)
            .populate('user', 'name username avatarUrl');

        // Hydrate
        const { default: Like } = await import('../models/likeModel.js');
        const { default: Comment } = await import('../models/commentModel.js');

        const postIds = posts.map(p => p._id);
        const myLikes = await Like.find({ user: req.user.id, post: { $in: postIds } });
        const myLikedPostIds = new Set(myLikes.map(l => l.post.toString()));

        const postsWithData = await Promise.all(posts.map(async (post) => {
            const postObj = post.toJSON();
            postObj.likes = myLikedPostIds.has(post._id.toString()) ? [req.user.id] : [];
            postObj.likesCount = post.likesCount || 0;
            postObj.commentsCount = post.commentsCount || 0;

            const recentComments = await Comment.find({ post: post._id })
                .sort({ createdAt: -1 })
                .limit(3)
                .populate('user', 'name username avatarUrl');
            postObj.comments = recentComments;
            return postObj;
        }));

        const validPosts = postsWithData.filter(post => post.user !== null);
        console.log(`✅ Discover found: ${validPosts.length} posts`);
        res.json(validPosts);

    } catch (error) {
        console.error("❌ Discover posts route error:", error);
        res.json([]);
    }
});

// @route   GET /api/posts/user/:id
// @desc    Get posts by a specific user - Scalable
router.get('/user/:id', protect, async (req, res) => {
    try {
        let posts = await Post.find({ user: req.params.id })
            .select('-likes -comments')
            .sort({ createdAt: -1 })
            .populate('user', 'name username avatarUrl');

        // Hydrate
        const { default: Like } = await import('../models/likeModel.js');
        const { default: Comment } = await import('../models/commentModel.js');

        const postIds = posts.map(p => p._id);
        const myLikes = await Like.find({ user: req.user.id, post: { $in: postIds } });
        const myLikedPostIds = new Set(myLikes.map(l => l.post.toString()));

        const postsWithData = await Promise.all(posts.map(async (post) => {
            const postObj = post.toJSON();
            postObj.likes = myLikedPostIds.has(post._id.toString()) ? [req.user.id] : [];
            postObj.likesCount = post.likesCount || 0;
            postObj.commentsCount = post.commentsCount || 0;

            const recentComments = await Comment.find({ post: post._id })
                .sort({ createdAt: -1 })
                .limit(3)
                .populate('user', 'name username avatarUrl');
            postObj.comments = recentComments;
            return postObj;
        }));

        res.json(postsWithData.filter(post => post.user !== null));
    } catch (error) {
        console.error("Error fetching user posts:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/posts/:id
// @desc    Get a single post by ID - Scalable
router.get('/:id', protect, async (req, res) => {
    try {
        let post = await Post.findById(req.params.id).select('-likes -comments').populate('user', 'name username avatarUrl');
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Hydrate
        const { default: Like } = await import('../models/likeModel.js');
        const { default: Comment } = await import('../models/commentModel.js');

        const isLiked = await Like.findOne({ user: req.user.id, post: post._id });
        const comments = await Comment.find({ post: post._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('user', 'name username avatarUrl');

        const postObj = post.toJSON();
        postObj.likes = isLiked ? [req.user.id] : [];
        postObj.likesCount = post.likesCount || 0;
        postObj.commentsCount = post.commentsCount || 0;
        postObj.comments = comments;

        res.json(postObj);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// @route   POST /api/posts
router.post('/', protect, async (req, res) => {
    const { content, imageUrl, tempId, mediaType = 'image', duration } = req.body;
    if (!content && !imageUrl) {
        return res.status(400).json({ message: 'Post must have content or an image/video' });
    }
    let finalImageUrl = null;
    let finalPublicId = null;

    try {
        if (imageUrl && imageUrl.startsWith('data:')) {
            const uploadOptions = {
                folder: 'tribe_social_posts',
                resource_type: mediaType === 'video' ? 'video' : 'image'
            };

            const uploadResponse = await cloudinary.uploader.upload(imageUrl, uploadOptions);
            finalImageUrl = uploadResponse.secure_url;
            finalPublicId = uploadResponse.public_id;
        } else if (imageUrl) {
            finalImageUrl = imageUrl;
        }

        const post = new Post({
            content: content || '',
            imageUrl: finalImageUrl,
            imagePublicId: finalPublicId,
            mediaType,
            duration,
            user: req.user.id,
        });

        let createdPost = await post.save();
        createdPost = await fullyPopulatePost(createdPost);

        // Include tempId so frontend can reconcile optimistic updates
        const postForSocket = { ...createdPost.toJSON(), tempId };
        req.io.emit('newPost', postForSocket);

        res.status(201).json(createdPost);
    } catch (error) {
        console.error("Create post error:", error);
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

        if (post.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(post.imagePublicId);
            } catch (err) {
                console.error("Failed to delete image from Cloudinary:", err);
            }
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
        let post = await Post.findById(req.params.id).select('-likes -comments');
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const { default: Like } = await import('../models/likeModel.js');
        const existingLike = await Like.findOne({ user: req.user.id, post: post._id });

        let userLiked = false;

        if (existingLike) {
            // Unlike
            await Like.deleteOne({ _id: existingLike._id });
            post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
            userLiked = false;
        } else {
            // Like
            await Like.create({ user: req.user.id, post: post._id });
            post.likesCount = (post.likesCount || 0) + 1;
            userLiked = true;

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

        // Return structured response matching new READ structure
        res.json({
            id: post._id,
            likes: userLiked ? [req.user.id] : [],
            likesCount: post.likesCount
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/posts/:id/comments
router.post('/:id/comments', protect, async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text is required' });
    try {
        let post = await Post.findById(req.params.id).select('-likes -comments');
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const { default: Comment } = await import('../models/commentModel.js');
        const newComment = await Comment.create({
            text,
            user: req.user.id,
            post: post._id
        });

        // Scalable Count Update
        post.commentsCount = (post.commentsCount || 0) + 1;

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

        await post.save();

        // Return updated structure
        const recentComments = await Comment.find({ post: post._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name username avatarUrl');

        const postObj = post.toJSON();
        postObj.comments = recentComments;
        postObj.commentsCount = post.commentsCount;

        const { default: Like } = await import('../models/likeModel.js');
        const isLiked = await Like.exists({ user: req.user.id, post: post._id });
        postObj.likes = isLiked ? [req.user.id] : [];
        postObj.likesCount = post.likesCount || 0;

        req.io.emit('postUpdated', postObj);
        res.status(201).json(postObj);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/posts/:id/comments/:comment_id
router.delete('/:id/comments/:comment_id', protect, async (req, res) => {
    try {
        let post = await Post.findById(req.params.id).select('-likes -comments');
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const { default: Comment } = await import('../models/commentModel.js');
        const commentDoc = await Comment.findById(req.params.comment_id);

        if (!commentDoc) return res.status(404).json({ message: 'Comment does not exist' });

        const commentOwnerId = commentDoc.user.toString();
        const postOwnerId = post.user.toString();

        if (commentOwnerId !== req.user.id && postOwnerId !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await Comment.deleteOne({ _id: req.params.comment_id });

        post.commentsCount = Math.max(0, (post.commentsCount || 0) - 1);
        await post.save();

        // Reconstruct response
        const recentComments = await Comment.find({ post: post._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name username avatarUrl');

        const postObj = post.toJSON();
        postObj.comments = recentComments;
        postObj.commentsCount = post.commentsCount;

        const { default: Like } = await import('../models/likeModel.js');
        const isLiked = await Like.exists({ user: req.user.id, post: post._id });
        postObj.likes = isLiked ? [req.user.id] : [];
        postObj.likesCount = post.likesCount || 0;

        req.io.emit('postUpdated', postObj);
        res.json(postObj);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
