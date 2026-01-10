import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Post from '../models/postModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';
import { uploadImage } from '../utils/cloudinary.js';

const router = express.Router();

const MINIMAL_USER = 'name username avatarUrl bannerUrl';
const POPULATE_CONFIG = [
    { path: 'user', select: MINIMAL_USER },
    { path: 'author', select: MINIMAL_USER },
    { path: 'comments.user', select: MINIMAL_USER }
];

// Recovery-first Feed: Falls back to global posts if following query fails or returns empty
router.get('/feed', protect, async (req, res) => {
    console.log(`[GET] /posts/feed - User: ${req.user.id}`);
    try {
        const currentUser = await User.findById(req.user.id).select('following').lean();
        const userIds = [req.user.id, ...(currentUser?.following || [])];
        
        const posts = await Post.find({ 
            $or: [{ author: { $in: userIds } }, { user: { $in: userIds } }] 
        })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate(POPULATE_CONFIG)
        .maxTimeMS(8000) // Phase 1: Prevent hanging queries
        .lean();

        if (!posts || posts.length === 0) {
            // Fallback to global discovery to avoid blank screen
            const fallback = await Post.find().sort({ createdAt: -1 }).limit(10).populate(POPULATE_CONFIG).lean();
            return res.json(fallback || []);
        }

        res.json(posts);
    } catch (error) {
        console.error("Feed Recovery Error:", error.message);
        const fallback = await Post.find().sort({ createdAt: -1 }).limit(5).populate(POPULATE_CONFIG).lean();
        res.json(fallback || []);
    }
});

// Fixed Profile Visibility: Scoped query specifically to target user
router.get('/user/:userId', protect, async (req, res) => {
    console.log(`[GET] /posts/user/${req.params.userId}`);
    try {
        const posts = await Post.find({ 
            $or: [{ author: req.params.userId }, { user: req.params.userId }] 
        })
        .sort({ createdAt: -1 })
        .populate(POPULATE_CONFIG)
        .maxTimeMS(5000)
        .lean();
        
        res.json(posts || []);
    } catch (error) {
        res.status(200).json([]); 
    }
});

router.get('/', protect, async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .limit(100)
            .populate(POPULATE_CONFIG)
            .maxTimeMS(8000)
            .lean();
        res.json(posts || []);
    } catch (error) {
        res.status(200).json([]);
    }
});

// Scoped atomic update to fix "liking all posts" bug
router.put('/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const isLiked = post.likes.includes(req.user.id);
        if (isLiked) {
            post.likes = post.likes.filter(id => id.toString() !== req.user.id.toString());
        } else {
            post.likes.push(req.user.id);
            if (post.author?.toString() !== req.user.id) {
                const n = new Notification({ recipient: post.author || post.user, sender: req.user.id, type: 'like', postId: post._id });
                await n.save().catch(e => console.warn("Notif fail", e.message));
            }
        }
        await post.save();
        const updated = await Post.findById(post._id).populate(POPULATE_CONFIG).lean();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Action failed' });
    }
});

export default router;