import express from 'express';
import rateLimit from 'express-rate-limit';
import protect from '../middleware/authMiddleware.js';
import requireAdmin from '../middleware/adminMiddleware.js';
import Report from '../models/reportModel.js';
import Post from '../models/postModel.js';
import User from '../models/userModel.js';
import Tribe from '../models/tribeModel.js';

const router = express.Router();

const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reports submitted. Please wait and try again.' },
});

router.post('/', protect, reportLimiter, async (req, res) => {
  try {
    const { targetType, targetId, reason, details = '', escalatedToSuperAdmin = false } = req.body;
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'targetType, targetId, and reason are required.' });
    }

    if (!['post', 'user', 'tribe'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid targetType.' });
    }

    if (targetType === 'post') {
      const post = await Post.findById(targetId);
      if (!post) return res.status(404).json({ message: 'Post not found.' });
    }

    if (targetType === 'user') {
      if (targetId.toString() === req.user.id.toString()) {
        return res.status(400).json({ message: 'You cannot report yourself.' });
      }
      const user = await User.findById(targetId);
      if (!user) return res.status(404).json({ message: 'User not found.' });
    }

    if (targetType === 'tribe') {
      const tribe = await Tribe.findById(targetId);
      if (!tribe) return res.status(404).json({ message: 'Tribe not found.' });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingReport = await Report.findOne({
      reporterId: req.user.id,
      targetType,
      targetId,
      createdAt: { $gte: since },
    });

    if (existingReport) {
      return res.status(429).json({ message: 'You already reported this within the last 24 hours.' });
    }

    const report = await Report.create({
      reporterId: req.user.id,
      targetType,
      targetId,
      reason,
      details,
      escalatedToSuperAdmin: Boolean(escalatedToSuperAdmin) && Boolean(req.user?.isAdmin),
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Report creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', protect, requireAdmin, async (req, res) => {
  try {
    const {
      targetType,
      targetId,
      status,
      reason,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    if (targetType) query.targetType = targetType;
    if (targetId) query.targetId = targetId;
    if (status) query.status = status;
    if (reason) query.reason = reason;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('reporterId', 'name username avatarUrl')
        .populate({
          path: 'targetId',
          populate: { path: 'user owner', select: 'name username avatarUrl' },
        }),
      Report.countDocuments(query),
    ]);

    res.json({
      reports,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    console.error('Fetch reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', protect, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    res.json(report);
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
