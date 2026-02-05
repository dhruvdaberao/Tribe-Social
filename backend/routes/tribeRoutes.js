import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Tribe from '../models/tribeModel.js';
import User from '../models/userModel.js';
import TribeMessage from '../models/tribeMessageModel.js';
import Notification from '../models/notificationModel.js';

const router = express.Router();

/* ======================================================
   TRIBE MANAGEMENT
====================================================== */

// GET /api/tribes
router.get('/', protect, async (req, res) => {
    try {
        const query = { isDeleted: { $ne: true } };
        if (!req.user?.isAdmin) {
            query.isHidden = { $ne: true };
        }
        const tribes = await Tribe.find(query)
            .sort({ createdAt: -1 })
            .select('name description avatarUrl owner members createdAt')
            .lean();

        res.status(200).json(tribes);
    } catch (error) {
        console.error('❌ GET /api/tribes ERROR:', error);
        res.status(500).json({ message: 'Server Error fetching tribes' });
    }
});

// GET /api/tribes/:id (OPTIMIZED)
router.get('/:id', protect, async (req, res) => {
    try {
        const tribe = await Tribe.findById(req.params.id)
            .select('name description avatarUrl owner members createdAt isHidden isDeleted')
            .lean();

        if (!tribe) {
            return res.status(404).json({ message: 'Tribe not found' });
        }
        if ((tribe.isHidden || tribe.isDeleted) && !req.user?.isAdmin) {
            return res.status(404).json({ message: 'Tribe not found' });
        }

        res.status(200).json(tribe);
    } catch (error) {
        console.error('❌ GET /api/tribes/:id ERROR:', error);
        res.status(500).json({ message: 'Failed to fetch tribe' });
    }
});

// POST /api/tribes
router.post('/', protect, async (req, res) => {
    try {
        const { name, description, avatarUrl } = req.body;

        if (!name || !description) {
            return res.status(400).json({ message: 'Name and description are required' });
        }

        const existing = await Tribe.findOne({ name });
        if (existing) {
            return res.status(400).json({ message: 'Tribe name already exists' });
        }

        let finalAvatarUrl = null;
        if (avatarUrl) {
            const { uploadBase64ToCloudinary } = await import('../utils/cloudinaryHelper.js');
            finalAvatarUrl = await uploadBase64ToCloudinary(avatarUrl, 'tribe_avatars');
        }

        const tribe = await Tribe.create({
            name,
            description,
            avatarUrl: finalAvatarUrl,
            owner: req.user.id,
            members: [req.user.id]
        });

        res.status(201).json(tribe);
    } catch (error) {
        console.error('❌ POST /api/tribes ERROR:', error);
        res.status(500).json({ message: 'Server Error creating tribe' });
    }
});

// PUT /api/tribes/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });

        if (tribe.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (req.body.owner) {
            const newOwnerId = req.body.owner;
            const isMember = tribe.members.some(m => m.toString() === newOwnerId.toString());
            if (!isMember) {
                return res.status(400).json({ message: 'New Chief must be a member' });
            }
            tribe.owner = newOwnerId;
        }

        tribe.name = req.body.name || tribe.name;
        tribe.description = req.body.description || tribe.description;

        if (req.body.avatarUrl !== undefined) {
            if (req.body.avatarUrl && req.body.avatarUrl !== tribe.avatarUrl) {
                const { uploadBase64ToCloudinary } = await import('../utils/cloudinaryHelper.js');
                tribe.avatarUrl = await uploadBase64ToCloudinary(req.body.avatarUrl, 'tribe_avatars');
            } else if (req.body.avatarUrl === null) {
                tribe.avatarUrl = null;
            }
        }

        const updated = await tribe.save();
        res.status(200).json(updated);
    } catch (error) {
        console.error('❌ PUT /api/tribes/:id ERROR:', error);
        res.status(500).json({ message: 'Server Error updating tribe' });
    }
});

// DELETE /api/tribes/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });

        if (tribe.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await TribeMessage.deleteMany({ tribe: tribe._id });
        await Notification.deleteMany({ tribeId: tribe._id });
        await tribe.deleteOne();

        if (req.io) {
            req.io.emit('tribeDeleted', tribe._id.toString());
        }

        res.status(200).json({ message: 'Tribe deleted' });
    } catch (error) {
        console.error('❌ DELETE /api/tribes/:id ERROR:', error);
        res.status(500).json({ message: 'Server Error deleting tribe' });
    }
});

/* ======================================================
   MEMBERSHIP
====================================================== */

// PUT /api/tribes/:id/join
router.put('/:id/join', protect, async (req, res) => {
    try {
        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });

        const userId = req.user.id;
        const isMember = tribe.members.some(id => id.toString() === userId);

        if (isMember) {
            if (tribe.owner.toString() === userId) {
                return res.status(400).json({ message: 'Owner cannot leave tribe' });
            }
            tribe.members = tribe.members.filter(id => id.toString() !== userId);
        } else {
            tribe.members.push(userId);
        }

        await tribe.save();
        res.status(200).json(tribe);
    } catch (error) {
        console.error('❌ PUT /api/tribes/:id/join ERROR:', error);
        res.status(500).json({ message: 'Server Error joining/leaving' });
    }
});

/* ======================================================
   CHAT
====================================================== */

// GET /api/tribes/:id/messages
router.get('/:id/messages', protect, async (req, res) => {
    try {
        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });

        const isMember = tribe.members.some(id => id.toString() === req.user.id);
        if (!isMember) {
            return res.status(403).json({ message: 'Must be a member' });
        }

        const messages = await TribeMessage.find({ tribe: tribe._id })
            .populate('sender', 'name username avatarUrl')
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error('❌ GET /api/tribes/:id/messages ERROR:', error);
        res.status(500).json({ message: 'Server Error fetching messages' });
    }
});

// POST /api/tribes/:id/messages
router.post('/:id/messages', protect, async (req, res) => {
    try {
        const { text, imageUrl } = req.body;

        if (!text && !imageUrl) {
            return res.status(400).json({ message: 'Message cannot be empty' });
        }

        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });

        const isMember = tribe.members.some(id => id.toString() === req.user.id);
        if (!isMember) {
            return res.status(403).json({ message: 'Must be a member' });
        }

        const message = await TribeMessage.create({
            tribe: tribe._id,
            sender: req.user.id,
            text,
            imageUrl: imageUrl || null
        });

        const populated = await message.populate(
            'sender',
            'name username avatarUrl'
        );

        const responseMessage = {
            id: populated._id.toString(),
            tempId: req.body.tempId, // 🔥 Return tempId for optimistic UI deduplication
            tribeId: tribe._id.toString(),
            sender: populated.sender,
            senderId: req.user.id,
            text: populated.text,
            imageUrl: populated.imageUrl,
            timestamp: populated.createdAt
        };

        /* 🔥 REAL-TIME MESSAGE (DETAIL PAGE) */
        if (req.io) {
            // Broadcast to the SPECIFIC tribe room
            const roomName = tribe._id.toString();
            console.log(`📡 Emitting 'newTribeMessage' to room: ${roomName}`);
            req.io.to(roomName).emit('newTribeMessage', responseMessage);

            /* 🔥 OPTION B — UNREAD COUNTS (USER-SCOPED) */
            // Notify members who are NOT in the room (or just everyone, client filters)
            tribe.members.forEach(memberId => {
                const mId = memberId.toString();
                if (mId !== req.user.id) {
                    req.io.to(`user-${mId}`).emit('tribeUnread', {
                        tribeId: tribe._id.toString()
                    });
                }
            });
        }

        res.status(201).json(populated);
    } catch (error) {
        console.error('❌ POST /api/tribes/:id/messages ERROR:', error);
        res.status(500).json({ message: 'Server Error sending message' });
    }
});

export default router;
