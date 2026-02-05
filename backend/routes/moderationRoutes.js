import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireAdmin, { requireSuperAdmin, isSuperAdminUser } from '../middleware/adminMiddleware.js';
import Report from '../models/reportModel.js';
import ModerationAction from '../models/moderationActionModel.js';
import Post from '../models/postModel.js';
import User from '../models/userModel.js';
import Tribe from '../models/tribeModel.js';
import Notification from '../models/notificationModel.js';

const router = express.Router();

const getActionStatus = (actionType) => {
  if (actionType === 'dismiss') return 'dismissed';
  return 'actioned';
};

const applyPostAction = async ({ post, actionType, adminId }) => {
  const now = new Date();
  switch (actionType) {
    case 'hide':
      post.isHidden = true;
      post.hiddenAt = now;
      post.hiddenBy = adminId;
      break;
    case 'unhide':
      post.isHidden = false;
      post.hiddenAt = null;
      post.hiddenBy = null;
      break;
    case 'delete':
      post.isDeleted = true;
      post.deletedAt = now;
      post.deletedBy = adminId;
      break;
    case 'restore':
      post.isDeleted = false;
      post.deletedAt = null;
      post.deletedBy = null;
      break;
    default:
      break;
  }
  await post.save();
};

const applyUserAction = async ({ user, actionType, adminId, reason }) => {
  const now = new Date();
  switch (actionType) {
    case 'hide':
      user.isHidden = true;
      user.hiddenAt = now;
      user.hiddenBy = adminId;
      break;
    case 'unhide':
      user.isHidden = false;
      user.hiddenAt = null;
      user.hiddenBy = null;
      break;
    case 'ban':
      user.isBanned = true;
      user.bannedAt = now;
      user.bannedBy = adminId;
      break;
    case 'unban':
      user.isBanned = false;
      user.bannedAt = null;
      user.bannedBy = null;
      break;
    case 'delete':
      user.isDeleted = true;
      user.deletedAt = now;
      user.deletedBy = adminId;
      break;
    case 'restore':
      user.isDeleted = false;
      user.deletedAt = null;
      user.deletedBy = null;
      break;
    default:
      break;
  }
  user.lastModerationAt = now;
  await user.save();
};

const applyTribeAction = async ({ tribe, actionType, adminId }) => {
  const now = new Date();
  switch (actionType) {
    case 'hide':
      tribe.isHidden = true;
      tribe.hiddenAt = now;
      tribe.hiddenBy = adminId;
      break;
    case 'unhide':
      tribe.isHidden = false;
      tribe.hiddenAt = null;
      tribe.hiddenBy = null;
      break;
    case 'delete':
      tribe.isDeleted = true;
      tribe.deletedAt = now;
      tribe.deletedBy = adminId;
      break;
    case 'restore':
      tribe.isDeleted = false;
      tribe.deletedAt = null;
      tribe.deletedBy = null;
      break;
    default:
      break;
  }
  tribe.lastModerationAt = now;
  await tribe.save();
};

const sendReportNotifications = async ({ reporterIds, adminId, message, targetType, targetId }) => {
  if (!message || reporterIds.length === 0) return;
  await Promise.all(
    reporterIds.map((reporterId) =>
      Notification.create({
        recipient: reporterId,
        sender: adminId,
        type: 'admin_action',
        text: message,
        postId: targetType === 'post' ? targetId : undefined,
        tribeId: targetType === 'tribe' ? targetId : undefined,
      })
    )
  );
};

router.post('/action', protect, requireAdmin, async (req, res) => {
  try {
    const { targetType, targetId, actionType, reason = '', message = '' } = req.body;

    if (!targetType || !targetId || !actionType) {
      return res.status(400).json({ message: 'targetType, targetId, and actionType are required.' });
    }

    const allowedActions = ['hide', 'unhide', 'delete', 'restore', 'warn', 'dismiss', 'ban', 'unban'];
    if (!allowedActions.includes(actionType)) {
      return res.status(400).json({ message: 'Invalid actionType.' });
    }

    let targetDoc = null;
    if (targetType === 'post') {
      targetDoc = await Post.findById(targetId);
      if (!targetDoc) return res.status(404).json({ message: 'Post not found.' });
      await applyPostAction({ post: targetDoc, actionType, adminId: req.user.id });
    }

    if (targetType === 'user') {
      targetDoc = await User.findById(targetId);
      if (!targetDoc) return res.status(404).json({ message: 'User not found.' });
      if ((targetDoc.isAdmin || targetDoc.isSuperAdmin) && !isSuperAdminUser(req.user)) {
        return res.status(403).json({ message: 'Super admin access required to moderate admins.' });
      }
      await applyUserAction({ user: targetDoc, actionType, adminId: req.user.id, reason });
    }

    if (targetType === 'tribe') {
      targetDoc = await Tribe.findById(targetId);
      if (!targetDoc) return res.status(404).json({ message: 'Tribe not found.' });
      await applyTribeAction({ tribe: targetDoc, actionType, adminId: req.user.id });
    }

    if (targetType === 'tribe') {
      targetDoc = await Tribe.findById(targetId);
      if (!targetDoc) return res.status(404).json({ message: 'Tribe not found.' });
      await applyTribeAction({ tribe: targetDoc, actionType, adminId: req.user.id });
    }

    const status = getActionStatus(actionType);
    await Report.updateMany(
      { targetType, targetId },
      { $set: { status } }
    );

    const reports = await Report.find({ targetType, targetId }).select('reporterId').lean();
    const reporterIds = [...new Set(reports.map((report) => report.reporterId.toString()))];
    await sendReportNotifications({ reporterIds, adminId: req.user.id, message, targetType, targetId });

    const moderationAction = await ModerationAction.create({
      adminId: req.user.id,
      targetType,
      targetId,
      actionType,
      reason,
      messageSent: message,
    });

    res.json({ message: 'Action recorded.', action: moderationAction });
  } catch (error) {
    console.error('Moderation action error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/posts', protect, requireAdmin, async (req, res) => {
  try {
    const {
      status,
      keyword,
      username,
      tags,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    if (status === 'hidden') query.isHidden = true;
    if (status === 'deleted') query.isDeleted = true;
    if (!status) {
      query.isDeleted = { $ne: true };
    }

    const contentFilters = [];
    if (keyword) {
      contentFilters.push({ content: { $regex: keyword, $options: 'i' } });
    }

    if (tags) {
      const tagList = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.replace(/^#/, ''));
      if (tagList.length > 0) {
        contentFilters.push({
          content: { $regex: tagList.map((tag) => `#${tag}`).join('|'), $options: 'i' },
        });
      }
    }

    if (contentFilters.length === 1) {
      query.content = contentFilters[0].content;
    }
    if (contentFilters.length > 1) {
      query.$and = contentFilters;
    }

    if (username) {
      const users = await User.find({ username: { $regex: username, $options: 'i' } }).select('_id');
      query.user = { $in: users.map((user) => user._id) };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('user', 'name username avatarUrl')
        .lean(),
      Post.countDocuments(query),
    ]);

    res.json({
      posts,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    console.error('Moderation posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', protect, requireAdmin, async (req, res) => {
  try {
    const {
      status,
      keyword,
      username,
      id,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    if (status === 'hidden') query.isHidden = true;
    if (status === 'deleted') query.isDeleted = true;
    if (!status) {
      query.isDeleted = { $ne: true };
    }

    if (username) {
      query.username = { $regex: username, $options: 'i' };
    }

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { bio: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (id) {
      query._id = id;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .select('name username avatarUrl bio isHidden hiddenAt isDeleted createdAt lastModerationAt'),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    console.error('Moderation users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/tribes', protect, requireAdmin, async (req, res) => {
  try {
    const {
      status,
      keyword,
      owner,
      id,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    if (status === 'hidden') query.isHidden = true;
    if (status === 'deleted') query.isDeleted = true;
    if (!status) {
      query.isDeleted = { $ne: true };
    }

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (owner) {
      const owners = await User.find({ username: { $regex: owner, $options: 'i' } }).select('_id');
      query.owner = { $in: owners.map((user) => user._id) };
    }

    if (id) {
      query._id = id;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [tribes, total] = await Promise.all([
      Tribe.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('owner', 'name username avatarUrl')
        .select('name description avatarUrl owner isHidden hiddenAt isDeleted createdAt lastModerationAt'),
      Tribe.countDocuments(query),
    ]);

    res.json({
      tribes,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    console.error('Moderation tribes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
