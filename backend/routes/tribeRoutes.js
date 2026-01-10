import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Tribe from '../models/tribeModel.js';

const router = express.Router();

// Recovery-first: Returns all tribes if filtering is complex/slow
router.get('/', protect, async (req, res) => {
    console.log(`[GET] /tribes - User: ${req.user.id}`);
    try {
        const tribes = await Tribe.find()
            .sort({ createdAt: -1 })
            .maxTimeMS(8000)
            .lean();
        
        console.log(`[RESULT] Found ${tribes?.length || 0} tribes`);
        res.json(tribes || []);
    } catch (error) {
        console.error("Tribe recovery fail:", error.message);
        res.status(200).json([]);
    }
});

router.get('/my-tribes', protect, async (req, res) => {
    try {
        const tribes = await Tribe.find({ 
            $or: [{ members: req.user.id }, { owner: req.user.id }] 
        })
        .sort({ updatedAt: -1 })
        .maxTimeMS(5000)
        .lean();
        res.json(tribes || []);
    } catch (error) {
        res.status(200).json([]);
    }
});

export default router;