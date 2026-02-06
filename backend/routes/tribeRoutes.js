import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Tribe from '../models/tribeModel.js';
import User from '../models/userModel.js';
import TribeMessage from '../models/tribeMessageModel.js';
import Notification from '../models/notificationModel.js';
import cloudinary from '../config/cloudinary.js';
import { sendPushToUser, sendPushToUsers } from '../services/pushService.js';
import { isPushEnabledFor } from '../utils/notificationPrefs.js';

const router = express.Router();

const filterDisabledMembers = async (tribes = []) => {
    const memberIds = [...new Set(tribes.flatMap((tribe) => tribe.members || []))];
    if (memberIds.length === 0) return tribes;
    const disabledUsers = await User.find({ _id: { $in: memberIds }, isDisabled: true }).select('_id');
    if (disabledUsers.length === 0) return tribes;
    const disabledIds = new Set(disabledUsers.map((user) => user._id.toString()));
    return tribes.map((tribe) => ({
        ...tribe,
        members: (tribe.members || []).filter((memberId) => !disabledIds.has(memberId.toString())),
    }));
};

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

        const response = !req.user?.isAdmin ? await filterDisabledMembers(tribes) : tribes;
        res.status(200).json(response);
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

        if (!req.user?.isAdmin) {
            const [filtered] = await filterDisabledMembers([tribe]);
            return res.status(200).json(filtered);
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
            if (tribe.owner.toString() !== userId) {
                const notification = new Notification({
                    recipient: tribe.owner,
                    sender: userId,
                    type: 'tribe_join',
                    tribeId: tribe._id,
                });
                await notification.save();
                const populatedNotification = await notification.populate('sender', 'name username avatarUrl');
                const recipientSocketId = req.onlineUsers?.get(tribe.owner.toString());
                if (recipientSocketId) {
                    req.io.to(recipientSocketId).emit('newNotification', populatedNotification);
                }

                const owner = await User.findById(tribe.owner).select('notificationPrefs isDisabled');
                if (owner && !owner.isDisabled && isPushEnabledFor(owner, 'tribeJoins')) {
                    await sendPushToUser(tribe.owner.toString(), {
                        title: 'New tribe member',
                        body: `${req.user?.name || 'Someone'} joined ${tribe.name}`,
                        url: `/tribes/${tribe._id}`,
                        icon: '/icons/icon-192.png',
                        tag: `tribe-join-${tribe._id}`,
                        data: {
                            type: 'tribe_join',
                            tribeId: tribe._id.toString(),
                            url: `/tribes/${tribe._id}`,
                        },
                    });
                }
            }
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

        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
        const before = req.query.before ? new Date(req.query.before) : null;
        const query = { tribe: tribe._id };
        if (before) {
            query.createdAt = { $lt: before };
        }

        const messages = await TribeMessage.find(query)
            .populate('sender', 'name username avatarUrl')
            .sort({ createdAt: -1 })
            .limit(limit);

        res.status(200).json(messages.reverse());
    } catch (error) {
        console.error('❌ GET /api/tribes/:id/messages ERROR:', error);
        res.status(500).json({ message: 'Server Error fetching messages' });
    }
});

// POST /api/tribes/:id/messages
router.post('/:id/messages', protect, async (req, res) => {
    try {
        const { text, imageUrl, attachment } = req.body;

        if (!text && !imageUrl && !attachment?.data) {
            return res.status(400).json({ message: 'Message cannot be empty' });
        }

        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });

        const isMember = tribe.members.some(id => id.toString() === req.user.id);
        if (!isMember) {
            return res.status(403).json({ message: 'Must be a member' });
        }

        let attachmentUrl = null;
        let attachmentType = null;
        let attachmentName = null;
        let attachmentSize = null;

        if (attachment?.data && attachment?.type) {
            const uploadResponse = await cloudinary.uploader.upload(attachment.data, {
                folder: 'tribe_messages',
                resource_type: 'auto',
            });
            attachmentUrl = uploadResponse.secure_url;
            attachmentType = attachment.type;
            attachmentName = attachment.name || null;
            attachmentSize = attachment.size || null;
        }

        const message = await TribeMessage.create({
            tribe: tribe._id,
            sender: req.user.id,
            text,
            imageUrl: imageUrl || (attachmentType?.startsWith('image/') ? attachmentUrl : null),
            attachmentUrl,
            attachmentType,
            attachmentName,
            attachmentSize
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
            attachmentUrl: populated.attachmentUrl,
            attachmentType: populated.attachmentType,
            attachmentName: populated.attachmentName,
            attachmentSize: populated.attachmentSize,
            timestamp: populated.createdAt
        };

        /* 🔥 REAL-TIME MESSAGE (DETAIL PAGE) */
        if (req.io) {
            // Broadcast to the SPECIFIC tribe room
            const roomName = tribe._id.toString();
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

        const memberIds = tribe.members
            .map((memberId) => memberId.toString())
            .filter((memberId) => memberId !== req.user.id);

        if (memberIds.length > 0) {
            const memberUsers = await User.find({ _id: { $in: memberIds }, isDisabled: { $ne: true } })
                .select('notificationPrefs');
            const enabledMemberIds = memberUsers.map((member) => member._id.toString());

            if (enabledMemberIds.length > 0) {
                const messagePreview = text?.slice(0, 80) || 'Sent an attachment';
                const notifications = enabledMemberIds.map((memberId) => ({
                    recipient: memberId,
                    sender: req.user.id,
                    type: 'tribe_message',
                    tribeId: tribe._id,
                    text: messagePreview,
                }));
                await Notification.insertMany(notifications);

                const pushRecipients = memberUsers
                    .filter((member) => isPushEnabledFor(member, 'tribe'))
                    .map((member) => member._id.toString());

                if (pushRecipients.length > 0) {
                    await sendPushToUsers(pushRecipients, {
                        title: tribe.name,
                        body: `${responseMessage.sender?.name || 'Someone'}: ${messagePreview}`,
                        url: `/tribes/${tribe._id}`,
                        icon: '/icons/icon-192.png',
                        tag: `tribe-${tribe._id}`,
                        data: {
                            type: 'tribe_message',
                            tribeId: tribe._id.toString(),
                            url: `/tribes/${tribe._id}`,
                        },
                    });
                }
            }
        }

        res.status(201).json(populated);
    } catch (error) {
        console.error('❌ POST /api/tribes/:id/messages ERROR:', error);
        res.status(500).json({ message: 'Server Error sending message' });
    }
});

export default router;
