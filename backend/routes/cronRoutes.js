import express from 'express';
import { sendDailyDigests } from '../services/digestService.js';

const router = express.Router();

// Protected by a simple key to prevent spam
const CRON_SECRET = process.env.CRON_SECRET || 'tribe_cron_secret';

const cleanToken = (token) => token?.replace("Bearer ", "").trim();

const protectCron = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || cleanToken(authHeader) !== CRON_SECRET) {
        return res.status(401).json({ message: 'Unauthorized Cron Request' });
    }
    next();
};

// @route   GET /api/cron/digest
// @desc    Trigger Daily Digests (Call this once every 24h)
router.get('/digest', protectCron, async (req, res) => {
    try {
        const result = await sendDailyDigests();
        res.status(200).json({
            message: 'Digest cycle completed',
            details: result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
