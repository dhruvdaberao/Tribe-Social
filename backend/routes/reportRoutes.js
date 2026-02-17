import express from 'express';
import rateLimit from 'express-rate-limit';
import protect from '../middleware/authMiddleware.js';
import requireAdmin from '../middleware/adminMiddleware.js';
import Report, { reportReasons } from '../models/reportModel.js';
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

const getTargetFromPayload = (body) => {
  if (body.reportedPost) return { targetType: 'post', targetId: body.reportedPost };
  if (body.reportedUser) return { targetType: 'user', targetId: body.reportedUser };
  if (body.reportedTribe) return { targetType: 'tribe', targetId: body.reportedTribe };
  if (body.targetType && body.targetId) return { targetType: body.targetType, targetId: body.targetId };
  return { targetType: null, targetId: null };
};

const toTargetFields = (targetType, targetId) => ({
  reportedPost: targetType === 'post' ? targetId : null,
  reportedUser: targetType === 'user' ? targetId : null,
  reportedTribe: targetType === 'tribe' ? targetId : null,
});

router.post('/', protect, reportLimiter, async (req, res) => {
  try {
    const { reason, details = '', escalatedToSuperAdmin = false } = req.body;
    const { targetType, targetId } = getTargetFromPayload(req.body);

    if (!req.user?.id) {
      return res.status(400).json({ message: 'Reporter user id is required.' });
    }

    if (!targetType || !targetId) {
      return res.status(400).json({ message: 'Exactly one report target is required.' });
    }

    if (!['post', 'user', 'tribe'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid target type.' });
    }

    if (!reason || !reportReasons.includes(reason)) {
      return res.status(400).json({ message: `Reason must be one of: ${reportReasons.join(', ')}.` });
    }

    if (targetType === 'post') {
      const post = await Post.findById(targetId).select('_id');
      if (!post) return res.status(404).json({ message: 'Post not found.' });
    }

    if (targetType === 'user') {
      if (targetId.toString() === req.user.id.toString()) {
        return res.status(400).json({ message: 'You cannot report yourself.' });
      }
      const user = await User.findById(targetId).select('_id');
      if (!user) return res.status(404).json({ message: 'User not found.' });
    }

    if (targetType === 'tribe') {
      const tribe = await Tribe.findById(targetId).select('_id');
      if (!tribe) return res.status(404).json({ message: 'Tribe not found.' });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingReport = await Report.findOne({
      reporterId: req.user.id,
      ...toTargetFields(targetType, targetId),
      createdAt: { $gte: since },
    });

    if (existingReport) {
      return res.status(429).json({ message: 'You already reported this within the last 24 hours.' });
    }

    const report = await Report.create({
      reporterId: req.user.id,
      reason,
      details,
      escalatedToSuperAdmin: Boolean(escalatedToSuperAdmin) && Boolean(req.user?.isAdmin),
      ...toTargetFields(targetType, targetId),
    });

    res.status(201).json(report);
  } catch (error) {
    if (error?.message?.includes('Exactly one of reportedPost')) {
      return res.status(400).json({ message: 'Exactly one of reportedPost, reportedUser, or reportedTribe is required.' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', protect, requireAdmin, async (req, res) => {
  try {
    const { targetType, status, reason, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (reason) query.reason = reason;
    if (targetType === 'post') query.reportedPost = { $ne: null };
    if (targetType === 'user') query.reportedUser = { $ne: null };
    if (targetType === 'tribe') query.reportedTribe = { $ne: null };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('reporterId', 'name username avatarUrl')
        .populate('reportedPost', 'content user isHidden isDeleted createdAt')
        .populate('reportedUser', 'name username avatarUrl isAdmin isSuperAdmin isHidden isDeleted isDisabled')
        .populate('reportedTribe', 'name owner isHidden isDeleted createdAt')
        .populate({ path: 'reportedPost', populate: { path: 'user', select: 'name username avatarUrl' } })
        .populate({ path: 'reportedTribe', populate: { path: 'owner', select: 'name username avatarUrl isAdmin isSuperAdmin' } }),
      Report.countDocuments(query),
    ]);

    res.json({ reports, total, page: parseInt(page, 10), pages: Math.ceil(total / parseInt(limit, 10)) });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', protect, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required.' });

    const report = await Report.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    res.json(report);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
