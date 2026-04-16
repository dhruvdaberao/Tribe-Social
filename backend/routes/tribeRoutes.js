import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Tribe from '../models/tribeModel.js';
import User from '../models/userModel.js';
import TribeMessage from '../models/tribeMessageModel.js';
import Notification from '../models/notificationModel.js';
import cloudinary from '../config/cloudinary.js';
import { sendPushToUser, sendPushToUsers, sendPushNotification } from '../services/pushService.js';
import { isPushEnabledFor } from '../utils/notificationPrefs.js';
import { sendEmailNotification } from '../services/emailNotificationService.js';

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
        const rawSearch = (req.query.search || '').toString().trim();
        if (rawSearch) {
            const escapedSearch = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { name: { $regex: escapedSearch, $options: 'i' } },
                { vibe: { $regex: escapedSearch, $options: 'i' } },
            ];
        }
        const tribes = await Tribe.find(query)
            .sort({ createdAt: -1 })
            .select('name description avatarUrl owner members memberLimit isPrivate vibe joinRequests createdAt')
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
            .select('name description avatarUrl owner members memberLimit isPrivate vibe joinRequests createdAt isHidden isDeleted')
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
        const { name, description, avatarUrl, memberLimit = 50, isPrivate = false, vibe = 'General' } = req.body;

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

        const allowedLimits = [10, 30, 50, 100];
        if (!allowedLimits.includes(Number(memberLimit))) {
            return res.status(400).json({ message: 'memberLimit must be one of 10, 30, 50, 100.' });
        }

        const tribe = await Tribe.create({
            name,
            description,
            avatarUrl: finalAvatarUrl,
            owner: req.user.id,
            members: [req.user.id],
            memberLimit: Number(memberLimit),
            isPrivate: Boolean(isPrivate),
            vibe: vibe || 'General',
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

        if (req.body.memberLimit !== undefined) {
            const nextLimit = Number(req.body.memberLimit);
            if (![10, 30, 50, 100].includes(nextLimit)) {
                return res.status(400).json({ message: 'memberLimit must be one of 10, 30, 50, 100.' });
            }
            if (nextLimit < tribe.members.length) {
                return res.status(400).json({
                    message: `Limit is below current members (${tribe.members.length}). Kick members to reduce to ${nextLimit} before lowering.`,
                });
            }
            tribe.memberLimit = nextLimit;
        }

        if (req.body.avatarUrl !== undefined) {
            if (req.body.avatarUrl && req.body.avatarUrl !== tribe.avatarUrl) {
                const { uploadBase64ToCloudinary } = await import('../utils/cloudinaryHelper.js');
                tribe.avatarUrl = await uploadBase64ToCloudinary(req.body.avatarUrl, 'tribe_avatars');
            } else if (req.body.avatarUrl === null) {
                tribe.avatarUrl = null;
            }
        }

        // Update isPrivate and vibe
        if (req.body.isPrivate !== undefined) {
            tribe.isPrivate = Boolean(req.body.isPrivate);
        }
        if (req.body.vibe !== undefined) {
            tribe.vibe = req.body.vibe;
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
        await Notification.deleteMany({
            $or: [
                { recipient: { $in: tribe.members } },
                { sender: { $in: tribe.members } },
            ],
            tribeId: tribe._id,
        });
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
            // 🔥 PRIVATE TRIBE GUARD: Cannot directly join a private tribe
            if (tribe.isPrivate) {
                return res.status(403).json({ message: 'This is a private tribe. Please send a join request.' });
            }
            const currentLimit = Number(tribe.memberLimit || 50);
            if (tribe.members.length >= currentLimit) {
                return res.status(400).json({ message: `This tribe is full (limit: ${currentLimit}).` });
            }
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

                const owner = await User.findById(tribe.owner).select('notificationPrefs isDisabled email name emailNotifications emailPrefs fcmToken pushNotifications pushPrefs');
                if (owner && !owner.isDisabled) {
                    await sendPushNotification({
                        user: owner,
                        type: 'tribeJoins',
                        title: 'New Member',
                        body: `${req.user?.name || 'Someone'} joined your tribe ${tribe.name}`
                    });
                }
                await sendEmailNotification({
                    user: owner,
                    type: 'tribeJoins',
                    subject: `New member joined ${tribe.name}`,
                    htmlContent: `<p>${req.user?.name || 'Someone'} joined your tribe, ${tribe.name}.</p>`,
                });
            }
        }

        await tribe.save();
        
        if (req.io) {
            req.io.emit('tribeUpdated', tribe);
        }

        res.status(200).json(tribe);
    } catch (error) {
        console.error('❌ PUT /api/tribes/:id/join ERROR:', error);
        res.status(500).json({ message: 'Server Error joining/leaving' });
    }
});

// PUT /api/tribes/:id/kick/:userId
router.put('/:id/kick/:userId', protect, async (req, res) => {
    try {
        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });

        if (tribe.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only Chief can kick members' });
        }

        const targetUserId = req.params.userId;
        if (targetUserId === tribe.owner.toString()) {
            return res.status(400).json({ message: 'Cannot kick the Chief' });
        }

        const isMember = tribe.members.some(id => id.toString() === targetUserId);
        if (!isMember) {
            return res.status(404).json({ message: 'User is not a member' });
        }

        // Remove member
        tribe.members = tribe.members.filter(id => id.toString() !== targetUserId);
        await tribe.save();

        if (req.io) {
            req.io.emit('tribeUpdated', tribe);
        }

        // Notifications
        if (req.io) {
            // Force kick via socket if online
            req.io.to(`user-${targetUserId}`).emit('kickedFromTribe', {
                tribeId: tribe._id,
                tribeName: tribe.name
            });

            // Notify tribe room? Maybe not necessary to announce publically, but maybe system message?
            // Optional: System message
            // ...
        }

        await Notification.create({
            recipient: targetUserId,
            sender: req.user.id,
            type: 'admin_action',
            text: `You were removed from ${tribe.name}.`,
            tribeId: tribe._id,
        });

        // Push Notification to kicked user
        const kickedUser = await User.findById(targetUserId).select('notificationPrefs isDisabled');
        if (kickedUser && !kickedUser.isDisabled && isPushEnabledFor(kickedUser, 'tribe')) {
            await sendPushToUser(targetUserId, {
                title: 'You were kicked',
                body: `You have been removed from ${tribe.name}`,
                url: `/tribes`, // Redirect to list presumably
                icon: '/icons/icon-192.png',
                tag: `tribe-kick-${tribe._id}`,
                data: {
                    type: 'tribe_kick',
                    tribeId: tribe._id.toString()
                }
            });
        }

        res.status(200).json(tribe);
    } catch (error) {
        console.error('❌ PUT /api/tribes/:id/kick/:userId ERROR:', error);
        res.status(500).json({ message: 'Server Error kicking member' });
    }
});

/* ======================================================
   JOIN REQUESTS (PRIVATE TRIBES)
====================================================== */

// POST /api/tribes/:id/request — Request to join a private tribe
router.post('/:id/request', protect, async (req, res) => {
    try {
        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });

        const userId = req.user.id;

        if (tribe.members.some(id => id.toString() === userId)) {
            return res.status(400).json({ message: 'You are already a member' });
        }
        if (tribe.joinRequests.some(id => id.toString() === userId)) {
            return res.status(400).json({ message: 'You have already requested to join' });
        }

        const currentLimit = Number(tribe.memberLimit || 50);
        if (tribe.members.length >= currentLimit) {
            return res.status(400).json({ message: `This tribe is full (limit: ${currentLimit}).` });
        }

        tribe.joinRequests.push(userId);
        await tribe.save();

        // Create a system message in the tribe chat
        const systemMessage = await TribeMessage.create({
            tribe: tribe._id,
            sender: userId,
            text: `${req.user.name || 'Someone'} requested to join the tribe.`,
            isSystem: true,
            systemAction: 'join_request',
            actionTargetId: userId,
        });

        const populated = await systemMessage.populate('sender', 'name username avatarUrl');

        // Broadcast to tribe room
        if (req.io) {
            const responseMessage = {
                id: populated._id.toString(),
                tribeId: tribe._id.toString(),
                sender: populated.sender,
                senderId: userId,
                text: populated.text,
                isSystem: true,
                systemAction: 'join_request',
                actionTargetId: userId,
                timestamp: populated.createdAt,
            };
            req.io.to(tribe._id.toString()).emit('newTribeMessage', responseMessage);
        }

        // Notify tribe owner
        const notification = new Notification({
            recipient: tribe.owner,
            sender: userId,
            type: 'tribe_join',
            tribeId: tribe._id,
            text: `${req.user.name || 'Someone'} requested to join ${tribe.name}`,
        });
        await notification.save();

        res.status(200).json(tribe);
    } catch (error) {
        console.error('❌ POST /api/tribes/:id/request ERROR:', error);
        res.status(500).json({ message: 'Server Error requesting to join' });
    }
});

// POST /api/tribes/:id/accept/:userId — Chief accepts a join request
router.post('/:id/accept/:userId', protect, async (req, res) => {
    try {
        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });

        if (tribe.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the Chief can accept requests' });
        }

        const targetUserId = req.params.userId;

        const requestIndex = tribe.joinRequests.findIndex(id => id.toString() === targetUserId);
        if (requestIndex === -1) {
            return res.status(404).json({ message: 'No pending request from this user' });
        }

        const currentLimit = Number(tribe.memberLimit || 50);
        if (tribe.members.length >= currentLimit) {
            return res.status(400).json({ message: `Tribe is full (limit: ${currentLimit}).` });
        }

        // Move from joinRequests to members
        tribe.joinRequests.splice(requestIndex, 1);
        tribe.members.push(targetUserId);
        await tribe.save();

        // Get the accepted user's info for the system message
        const acceptedUser = await User.findById(targetUserId).select('name username avatarUrl');

        // Create a "joined" system message
        const systemMessage = await TribeMessage.create({
            tribe: tribe._id,
            sender: targetUserId,
            text: `${acceptedUser?.name || 'A user'} has joined the tribe!`,
            isSystem: true,
            systemAction: 'joined',
            actionTargetId: targetUserId,
        });

        const populated = await systemMessage.populate('sender', 'name username avatarUrl');

        if (req.io) {
            const responseMessage = {
                id: populated._id.toString(),
                tribeId: tribe._id.toString(),
                sender: populated.sender,
                senderId: targetUserId,
                text: populated.text,
                isSystem: true,
                systemAction: 'joined',
                actionTargetId: targetUserId,
                timestamp: populated.createdAt,
            };
            req.io.to(tribe._id.toString()).emit('newTribeMessage', responseMessage);
        }

        // Notify the accepted user
        const notification = await Notification.create({
            recipient: targetUserId,
            sender: req.user.id,
            type: 'tribe_join',
            tribeId: tribe._id,
            text: `Your request to join ${tribe.name} was accepted!`,
        });

        const recipientUser = await User.findById(targetUserId).select('fcmToken pushNotifications pushPrefs isDisabled');
        if (recipientUser && !recipientUser.isDisabled) {
            await sendPushNotification({
                user: recipientUser,
                type: 'tribeJoins',
                title: 'Request Accepted',
                body: `Your request to join ${tribe.name} was accepted!`
            });
        }

        res.status(200).json(tribe);
    } catch (error) {
        console.error('❌ POST /api/tribes/:id/accept/:userId ERROR:', error);
        res.status(500).json({ message: 'Server Error accepting request' });
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
        const query = { tribe: tribe._id, deletedFor: { $ne: req.user._id } };
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
        const { text, imageUrl, attachment, replyTo } = req.body;

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
            attachmentSize,
            replyTo: replyTo || null
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
            replyTo: populated.replyTo ? populated.replyTo.toString() : null,
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
                .select('notificationPrefs email name emailNotifications emailPrefs');
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
                    .filter((member) => member.fcmToken && member.pushNotifications !== false && (member.pushPrefs?.tribeMessages !== false));

                for (const member of pushRecipients) {
                    await sendPushNotification({
                        user: member,
                        type: 'tribeMessages',
                        title: tribe.name,
                        body: `${responseMessage.sender?.name || 'Someone'}: ${messagePreview}`
                    });
                }

                await Promise.all(memberUsers.map((member) => sendEmailNotification({
                    user: member,
                    type: 'tribeMessages',
                    subject: `New message in ${tribe.name}`,
                    htmlContent: `<p>${responseMessage.sender?.name || 'Someone'} sent a message in ${tribe.name}: ${messagePreview}</p>`,
                })));
            }
        }

        res.status(201).json(populated);
    } catch (error) {
        console.error('❌ POST /api/tribes/:id/messages ERROR:', error);
        res.status(500).json({ message: 'Server Error sending message' });
    }
});

// DELETE /api/tribes/:id/messages/:messageId
router.delete('/:id/messages/:messageId', protect, async (req, res) => {
    try {
        const { id, messageId } = req.params;
        const userId = req.user._id;
        const message = await TribeMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        const tribe = await Tribe.findById(id).select('owner');
        const isOwner = tribe?.owner?.toString() === userId.toString();
        const isSender = message.sender.toString() === userId.toString();
        if (!isSender && !isOwner && !req.user?.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }
        await message.deleteOne();

        if (req.io) {
            req.io.to(id.toString()).emit('tribeMessageDeleted', { tribeId: id, messageId });
        }

        res.status(200).json({ ok: true, messageId });
    } catch (error) {
        console.error('❌ DELETE /api/tribes/:id/messages/:messageId ERROR:', error);
        res.status(500).json({ message: 'Server Error deleting message' });
    }
});

// PUT /api/tribes/:id/messages/:messageId/delete-for-me
router.put('/:id/messages/:messageId/delete-for-me', protect, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;
        const message = await TribeMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        message.deletedFor = Array.from(new Set([...(message.deletedFor || []), userId]));
        await message.save();
        res.status(200).json({ ok: true, messageId });
    } catch (error) {
        console.error('❌ PUT /api/tribes/:id/messages/:messageId/delete-for-me ERROR:', error);
        res.status(500).json({ message: 'Server Error updating message' });
    }
});

export default router;
