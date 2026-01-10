// import express from 'express';
// import protect from '../middleware/authMiddleware.js';
// import Tribe from '../models/tribeModel.js';

// const router = express.Router();

// // @route   GET /api/tribes
// // Recovery: Return all tribes to prevent empty page bug
// router.get('/', protect, async (req, res) => {
//     console.log(`[QUERY] Fetching all tribes`);
//     try {
//         const tribes = await Tribe.find()
//             .sort({ createdAt: -1 })
//             .maxTimeMS(5000)
//             .lean();
        
//         console.log(`[RESULT] Found ${tribes?.length || 0} tribes`);
//         res.json(tribes || []);
//     } catch (error) {
//         console.error("Tribe recovery fail:", error.message);
//         res.status(200).json([]);
//     }
// });

// router.get('/my-tribes', protect, async (req, res) => {
//     try {
//         const tribes = await Tribe.find({ 
//             $or: [{ members: req.user.id }, { owner: req.user.id }] 
//         })
//         .sort({ updatedAt: -1 })
//         .lean();
//         res.json(tribes || []);
//     } catch (error) {
//         res.status(200).json([]);
//     }
// });

// export default router;




import express from 'express';
import mongoose from 'mongoose';
import protect from '../middleware/authMiddleware.js';
import Tribe from '../models/tribeModel.js';

const router = express.Router();

// GET ALL TRIBES
router.get('/', protect, async (req, res) => {
  try {
    const tribes = await Tribe.find().sort({ createdAt: -1 }).lean();
    res.json(tribes || []);
  } catch {
    res.json([]);
  }
});

// TRIBE MESSAGES
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const tribe = await Tribe.findById(req.params.id)
      .populate('messages.sender', 'name username avatarUrl')
      .lean();
    res.json(tribe?.messages || []);
  } catch {
    res.json([]);
  }
});

router.post('/:id/messages', protect, async (req, res) => {
  try {
    const tribe = await Tribe.findById(req.params.id);
    if (!tribe) return res.status(404).json([]);

    const msg = {
      _id: new mongoose.Types.ObjectId(),
      sender: req.user.id,
      text: req.body.text,
      timestamp: new Date(),
    };

    tribe.messages.push(msg);
    await tribe.save();

    res.status(201).json(msg);
  } catch {
    res.status(500).json({});
  }
});

router.delete('/:tribeId/messages/:messageId', protect, async (req, res) => {
  try {
    await Tribe.updateOne(
      { _id: req.params.tribeId },
      { $pull: { messages: { _id: req.params.messageId } } }
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({});
  }
});

export default router;
