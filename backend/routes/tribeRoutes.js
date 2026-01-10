import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Tribe from '../models/tribeModel.js';
import TribeMessage from '../models/tribeMessageModel.js';
import Notification from '../models/notificationModel.js';

const router = express.Router();

// ===================================
// TRIBE MANAGEMENT ROUTES
// ===================================

// @route   GET /api/tribes
// @desc    Get ALL tribes (Optimized)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        console.log("🔍 GET /api/tribes - REQUEST RECEIVED");
        const count = await Tribe.countDocuments();
        console.log(`📊 Total Tribes in DB: ${count}`);

        // Fetch tribes - Lean for performance, select necessary fields
        const tribes = await Tribe.find({})
            .sort({ createdAt: -1 }) // Newest first
            .select('name description avatarUrl owner members createdAt')
            .lean();

        console.log(`✅ Returning ${tribes.length} tribes to frontend.`);
        res.status(200).json(tribes);
    } catch (error) {
        console.error("❌ GET /api/tribes ERROR:", error);
        res.status(500).json({ message: 'Server Error fetching tribes' });
    }
});

// @route   POST /api/tribes
// @desc    Create a new tribe
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { name, description, avatarUrl } = req.body;

        if (!name || !description) {
            return res.status(400).json({ message: 'Name and description are required' });
        }

        const existingTribe = await Tribe.findOne({ name });
        if (existingTribe) {
            return res.status(400).json({ message: 'Tribe name already exists' });
        }

        const newTribe = await Tribe.create({
            name,
            description,
            avatarUrl: avatarUrl || null,
            owner: req.user.id,
            members: [req.user.id] // Creator is always the first member
        });

        console.log(`🎉 New Tribe Created: ${newTribe.name} by ${req.user.name}`);
        res.status(201).json(newTribe);
    } catch (error) {
        console.error("❌ POST /api/tribes ERROR:", error);
        res.status(500).json({ message: 'Server Error creating tribe' });
    }
});

// @route   PUT /api/tribes/:id
// @desc    Update tribe details (Admin only)
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const { name, description, avatarUrl } = req.body;
        const tribe = await Tribe.findById(req.params.id);

        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });

        // AUTHORIZATION CHECK
        if (tribe.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this tribe' });
        }

        tribe.name = name || tribe.name;
        tribe.description = description || tribe.description;
        if (avatarUrl !== undefined) tribe.avatarUrl = avatarUrl;

        const updatedTribe = await tribe.save();
        console.log(`📝 Tribe Updated: ${updatedTribe.name}`);
        res.status(200).json(updatedTribe);
    } catch (error) {
        console.error("❌ PUT /api/tribes/:id ERROR:", error);
        res.status(500).json({ message: 'Server Error updating tribe' });
    }
});

// @route   DELETE /api/tribes/:id
// @desc    Delete tribe and all associated data (Admin only)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const tribe = await Tribe.findById(req.params.id);

        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });

        // AUTHORIZATION CHECK
        if (tribe.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this tribe' });
        }

        // CASCADE DELETE
        await TribeMessage.deleteMany({ tribe: tribe._id });
        await Notification.deleteMany({ tribeId: tribe._id });
        await tribe.deleteOne();

        // SOCKET EVENT could be emitted here if global namespace exists
        // req.io.emit('tribeDeleted', req.params.id); 

        console.log(`🗑️ Tribe Deleted: ${tribe.name}`);
        res.status(200).json({ message: 'Tribe deleted successfully' });
    } catch (error) {
        console.error("❌ DELETE /api/tribes/:id ERROR:", error);
        res.status(500).json({ message: 'Server Error deleting tribe' });
    }
});

// ===================================
// MEMBERSHIP ROUTES
// ===================================

// @route   PUT /api/tribes/:id/join
// @desc    Toggle Join/Leave tribe
// @access  Private
router.put('/:id/join', protect, async (req, res) => {
    try {
        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });

        const userId = req.user.id;
        const isMember = tribe.members.includes(userId);

        if (isMember) {
            // LEAVE logic
            if (tribe.owner.toString() === userId) {
                return res.status(400).json({ message: 'Owner cannot leave their own tribe' });
            }
            tribe.members = tribe.members.filter(id => id.toString() !== userId);
        } else {
            // JOIN logic
            tribe.members.push(userId);

            // Notification logic (Optional, keep it simple for now)
            if (tribe.owner.toString() !== userId) {
                // Create notification logic here if needed
            }
        }

        await tribe.save();
        res.status(200).json(tribe);
    } catch (error) {
        console.error("❌ PUT /api/tribes/:id/join ERROR:", error);
        res.status(500).json({ message: 'Server Error joining/leaving' });
    }
});

// ===================================
// CHAT ROUTES
// ===================================

// @route   GET /api/tribes/:id/messages
// @desc    Get chat history
// @access  Private (Members only)
router.get('/:id/messages', protect, async (req, res) => {
    try {
        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });

        // CHECK MEMBERSHIP
        // Note: We cast to string for reliable comparison
        const isMember = tribe.members.some(id => id.toString() === req.user.id);
        if (!isMember) {
            return res.status(403).json({ message: 'Must be a member to view messages' });
        }

        const messages = await TribeMessage.find({ tribe: tribe._id })
            .populate('sender', 'name username avatarUrl')
            .sort({ createdAt: 1 }); // Oldest first

        res.status(200).json(messages);
    } catch (error) {
        console.error("❌ GET /api/tribes/:id/messages ERROR:", error);
        res.status(500).json({ message: 'Server Error fetching messages' });
    }
});

// @route   POST /api/tribes/:id/messages
// @desc    Send a message
// @access  Private (Members only)
router.post('/:id/messages', protect, async (req, res) => {
    try {
        const { text, imageUrl } = req.body;

        if (!text && !imageUrl) {
            return res.status(400).json({ message: 'Message cannot be empty' });
        }

        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });

        // CHECK MEMBERSHIP
        const isMember = tribe.members.some(id => id.toString() === req.user.id);
        if (!isMember) {
            return res.status(403).json({ message: 'Must be a member to send messages' });
        }

        const newMessage = await TribeMessage.create({
            tribe: tribe._id,
            sender: req.user.id,
            text,
            imageUrl: imageUrl || null
        });

        // POPULATE IMMEDIATELY for Frontend
        const populatedMessage = await newMessage.populate('sender', 'name username avatarUrl');

        // EMIT SOCKET EVENT
        // Ensure io is attached to req (standard in this app)
        if (req.io) {
            req.io.to(`tribe-${tribe._id}`).emit('newTribeMessage', populatedMessage);
        } else {
            console.warn("⚠️ Socket.IO instance not found on request object");
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error("❌ POST /api/tribes/:id/messages ERROR:", error);
        res.status(500).json({ message: 'Server Error sending message' });
    }
});

export default router;
