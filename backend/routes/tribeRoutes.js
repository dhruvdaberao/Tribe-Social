import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Tribe from '../models/tribeModel.js';
import TribeMessage from '../models/tribeMessageModel.js';
import Notification from '../models/notificationModel.js';

const router = express.Router();

/* ======================================================
   TRIBE MANAGEMENT
====================================================== */

// GET /api/tribes
router.get('/', protect, async (req, res) => {
  try {
    const tribes = await Tribe.find({})
      .sort({ createdAt: -1 })
      .select('name description avatarUrl owner members createdAt')
      .lean();

    res.status(200).json(tribes);
  } catch (error) {
    console.error('❌ GET /api/tribes ERROR:', error);
    res.status(500).json({ message: 'Server Error fetching tribes' });
  }
});

// GET /api/tribes/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const tribe = await Tribe.findById(req.params.id);
    if (!tribe) return res.status(404).json({ message: 'Tribe not found' });

    res.json(tribe);
  } catch (error) {
    console.error('❌ GET /api/tribes/:id ERROR:', error);
    res.status(500).json({ message: 'Server Error fetching tribe' });
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

    const tribe = await Tribe.create({
      name,
      description,
      avatarUrl: avatarUrl || null,
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

    tribe.name = req.body.name || tribe.name;
    tribe.description = req.body.description || tribe.description;
    if (req.body.avatarUrl !== undefined) tribe.avatarUrl = req.body.avatarUrl;

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

    /* 🔥 REAL-TIME MESSAGE (DETAIL PAGE) */
    if (req.io) {
      req.io.to(tribe._id.toString()).emit('newTribeMessage', {
        id: populated._id.toString(),
        tribeId: tribe._id.toString(),
        sender: populated.sender,
        senderId: req.user.id,
        text: populated.text,
        imageUrl: populated.imageUrl,
        timestamp: populated.createdAt
      });

      /* 🔥 OPTION B — UNREAD COUNTS (USER-SCOPED) */
      tribe.members.forEach(memberId => {
        if (memberId.toString() !== req.user.id) {
          req.io.to(`user-${memberId}`).emit('tribeUnread', {
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
