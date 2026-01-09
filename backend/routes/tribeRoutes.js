import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Tribe from '../models/tribeModel.js';

const router = express.Router();

// @route   GET /api/tribes
// Recovery: Return all tribes to prevent empty page bug
router.get('/', protect, async (req, res) => {
    console.log(`[QUERY] Fetching all tribes`);
    try {
        const tribes = await Tribe.find()
            .sort({ createdAt: -1 })
            .maxTimeMS(5000)
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
        .lean();
        res.json(tribes || []);
    } catch (error) {
        res.status(200).json([]);
    }
});

export default router;