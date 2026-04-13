// import express from 'express';
// import Message from '../models/messageModel.js';
// import User from '../models/userModel.js';
// import protect from '../middleware/authMiddleware.js';
// import mongoose from 'mongoose';
// import Notification from '../models/notificationModel.js';

// const router = express.Router();

// // @route   GET /api/messages/conversations
// // @desc    Get all conversations for the current user
// router.get('/conversations', protect, async (req, res) => {
//     try {
//         const userId = new mongoose.Types.ObjectId(req.user.id);

//         const messages = await Message.aggregate([
//             { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
//             { $sort: { createdAt: -1 } },
//             {
//                 $group: {
//                     _id: {
//                         $cond: [
//                             { $gt: ["$sender", "$receiver"] },
//                             { sender: "$sender", receiver: "$receiver" },
//                             { sender: "$receiver", receiver: "$sender" }
//                         ]
//                     },
//                     lastMessage: { $first: "$message" },
//                     timestamp: { $first: "$createdAt" },
//                     docId: { $first: "$_id" }
//                 }
//             },
//              {
//                 $project: {
//                     _id: 0,
//                     conversationId: "$_id",
//                     lastMessage: "$lastMessage",
//                     timestamp: "$timestamp"
//                 }
//             },
//             { $sort: { timestamp: -1 } },
//         ]);

//         const conversations = messages.map(msg => {
//             const otherUserId = msg.conversationId.sender.equals(userId) ? msg.conversationId.receiver : msg.conversationId.sender;
//             return {
//                 id: `${msg.conversationId.sender}-${msg.conversationId.receiver}`, // A consistent ID
//                 participants: [{id: req.user.id}, {id: otherUserId.toString()}],
//                 lastMessage: msg.lastMessage,
//                 timestamp: msg.timestamp
//             };
//         });

//         res.status(200).json(conversations);

//     } catch (error) {
//         res.status(500).json({ error: "Internal server error" });
//     }
// });


// // @route   POST /api/messages/send/:receiverId
// // @desc    Send a message to a user
// router.post('/send/:receiverId', protect, async (req, res) => {
//     try {
//         const { message, imageUrl } = req.body;
//         const { receiverId } = req.params;
//         const senderId = req.user._id;

//         const newMessage = new Message({
//             sender: senderId,
//             receiver: receiverId,
//             message,
//             imageUrl: imageUrl || null
//         });

//         await newMessage.save();

//         const responseMessage = newMessage.toJSON();

//         // Emit the message to the specific room for this DM
//         const roomName = `dm-${[senderId.toString(), receiverId].sort().join('-')}`;
//         req.io.to(roomName).emit('newMessage', responseMessage);

//         // Create and emit notification to the receiver
//         const notification = new Notification({
//             recipient: receiverId,
//             sender: senderId,
//             type: 'message',
//         });
//         await notification.save();
//         const populatedNotification = await notification.populate('sender', 'id name username avatarUrl');

//         const recipientSocketId = req.onlineUsers.get(receiverId.toString());
//         if (recipientSocketId) {
//             req.io.to(recipientSocketId).emit('newNotification', populatedNotification);
//         }

//         res.status(201).json(responseMessage);

//     } catch (error) {
//         res.status(500).json({ error: "Internal server error" });
//     }
// });

// // @route   GET /api/messages/:userToChatId
// // @desc    Get messages between current user and another user
// router.get('/:userToChatId', protect, async (req, res) => {
//     try {
//         const { userToChatId } = req.params;
//         const senderId = req.user._id;

//         const messages = await Message.find({
//             $or: [
//                 { sender: senderId, receiver: userToChatId },
//                 { sender: userToChatId, receiver: senderId },
//             ],
//         }).sort({ createdAt: 1 });

//         res.status(200).json(messages.map(m => m.toJSON()));

//     } catch (error) {
//         res.status(500).json({ error: "Internal server error" });
//     }
// });

// export default router;







import express from 'express';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';
import protect from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';
import Notification from '../models/notificationModel.js';
import { sendPushToUser, sendPush, sendPushNotification } from '../services/pushService.js';
import { isPushEnabledFor } from '../utils/notificationPrefs.js';
import cloudinary from '../config/cloudinary.js';
import { sendEmailNotification } from '../services/emailNotificationService.js';

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get all conversations for the current user
router.get('/conversations', protect, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const messages = await Message.aggregate([
            { $match: { $or: [{ sender: userId }, { receiver: userId }], deletedFor: { $ne: userId } } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $gt: ["$sender", "$receiver"] },
                            { sender: "$sender", receiver: "$receiver" },
                            { sender: "$receiver", receiver: "$sender" }
                        ]
                    },
                    lastMessage: { $first: "$message" },
                    timestamp: { $first: "$createdAt" },
                    docId: { $first: "$_id" }
                }
            },
            {
                $project: {
                    _id: 0,
                    conversationId: "$_id",
                    lastMessage: "$lastMessage",
                    timestamp: "$timestamp"
                }
            },
            { $sort: { timestamp: -1 } },
        ]);

        const conversations = messages.map(msg => {
            const otherUserId = msg.conversationId.sender.equals(userId) ? msg.conversationId.receiver : msg.conversationId.sender;
            return {
                id: `${msg.conversationId.sender}-${msg.conversationId.receiver}`, // A consistent ID
                participants: [{ id: req.user.id }, { id: otherUserId.toString() }],
                lastMessage: msg.lastMessage,
                timestamp: msg.timestamp
            };
        });
        if (!req.user?.isAdmin && conversations.length > 0) {
            const otherUserIds = conversations
                .map(conversation => conversation.participants.find(participant => participant.id !== req.user.id)?.id)
                .filter(Boolean);
            const disabledUsers = await User.find({ _id: { $in: otherUserIds }, isDisabled: true }).select('_id');
            const disabledIds = new Set(disabledUsers.map(user => user._id.toString()));
            const filtered = conversations.filter(conversation => {
                const otherId = conversation.participants.find(participant => participant.id !== req.user.id)?.id;
                return otherId ? !disabledIds.has(otherId) : true;
            });
            return res.status(200).json(filtered);
        }

        res.status(200).json(conversations);

    } catch (error) {
        console.error("Error in getConversations controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});


// @route   POST /api/messages/send/:receiverId
// @desc    Send a message to a user
router.post('/send/:receiverId', protect, async (req, res) => {
    try {
        const { message, imageUrl, attachment, replyTo } = req.body;
        const { receiverId } = req.params;
        const senderId = req.user._id;

        const receiver = await User.findById(receiverId).select('isDisabled notificationPrefs name email emailNotifications emailPrefs fcmToken pushNotifications pushPrefs');
        if (!receiver) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (receiver.isDisabled && !req.user?.isAdmin) {
            return res.status(403).json({ message: 'User is disabled.' });
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

        if (!message && !imageUrl && !attachment?.data) {
            return res.status(400).json({ message: 'Message cannot be empty.' });
        }

        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            message: message || '',
            imageUrl: imageUrl || (attachmentType?.startsWith('image/') ? attachmentUrl : null),
            attachmentUrl,
            attachmentType,
            attachmentName,
            attachmentSize,
            replyTo: replyTo || null
        });

        await newMessage.save();

        const responseMessage = {
            ...newMessage.toJSON(),
            tempId: req.body.tempId // 🔥 Return tempId for optimistic UI deduplication
        };

        // Emit the message to the specific room for this DM
        // Room Name Convention: dm-{sorted(id1, id2)}
        const roomName = `dm-${[senderId.toString(), receiverId].sort().join('-')}`;

        if (req.io) {
            req.io.to(roomName).emit('newMessage', responseMessage);

            // Also emit to receiver's personal room for Notifications/Unread counts
            // This ensures they get it even if they aren't "in" the DM room explicitly yet
            const recipientRoom = `user-${receiverId}`;
            req.io.to(recipientRoom).emit('newMessage', responseMessage);
        }

        const sender = await User.findById(senderId).select('name username avatarUrl');
        if (sender && receiverId.toString() !== senderId.toString()) {
            const messagePreview = message?.slice(0, 50) + (message?.length > 50 ? '...' : '');
            const notification = new Notification({
                recipient: receiverId,
                sender: senderId,
                type: 'message',
                text: messagePreview || 'Sent an attachment',
            });
            await notification.save();
            const populatedNotification = await notification.populate('sender', 'name username avatarUrl');

            const recipientSocket = req.onlineUsers?.get(receiverId.toString());
            if (recipientSocket) {
                req.io.to(recipientSocket).emit('newNotification', populatedNotification);
            }

            const isReceiverOnline = req.onlineUsers?.get(receiverId.toString());
            if (!isReceiverOnline && isPushEnabledFor(receiver, 'dm')) {
                await sendPushToUser(receiverId.toString(), {
                    title: sender?.name || 'New message',
                    body: messagePreview || 'Sent an attachment',
                    url: `/messages/${senderId}`,
                    icon: '/icons/icon-192.png',
                    tag: `dm-${senderId}`,
                    data: {
                        type: 'message',
                        senderId: senderId.toString(),
                        url: `/messages/${senderId}`,
                    },
                });
                await sendPushNotification({
                    user: receiver,
                    type: "directMessages",
                    title: sender?.name || "New message",
                    body: messagePreview || "Sent an attachment"
                });
            }

            await sendEmailNotification({
                user: receiver,
                type: 'directMessages',
                subject: `${sender?.name || 'Someone'} sent you a new message`,
                htmlContent: `<p>${sender?.name || 'Someone'} sent you a new message on Tribe Social.</p>`,
            });
        }

        res.status(201).json(responseMessage);

    } catch (error) {
        console.error("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// @route   GET /api/messages/:userToChatId
// @desc    Get messages between current user and another user
router.get('/:userToChatId', protect, async (req, res) => {
    try {
        const { userToChatId } = req.params;
        const senderId = req.user._id;
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
        const before = req.query.before ? new Date(req.query.before) : null;

        const otherUser = await User.findById(userToChatId).select('isDisabled');
        if (!otherUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (otherUser.isDisabled && !req.user?.isAdmin) {
            return res.status(403).json({ message: 'User is disabled.' });
        }

        const query = {
            $or: [
                { sender: senderId, receiver: userToChatId },
                { sender: userToChatId, receiver: senderId },
            ],
            deletedFor: { $ne: senderId },
        };
        if (before) {
            query.createdAt = { $lt: before };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit);

        res.status(200).json(messages.reverse().map(m => m.toJSON()));

    } catch (error) {
        console.error("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// @route   PUT /api/messages/:messageId/delete-for-me
// @desc    Hide a message for the current user
router.put('/:messageId/delete-for-me', protect, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        const isParticipant = message.sender.toString() === userId.toString() || message.receiver.toString() === userId.toString();
        if (!isParticipant) {
            return res.status(403).json({ message: 'Not authorized to modify this message' });
        }
        message.deletedFor = Array.from(new Set([...(message.deletedFor || []), userId]));
        await message.save();
        res.status(200).json({ ok: true, messageId });
    } catch (error) {
        console.error('Error deleting message for user:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete a message for everyone
router.delete('/:messageId', protect, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        const isSender = message.sender.toString() === userId.toString();
        if (!isSender && !req.user?.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }
        const senderId = message.sender.toString();
        const receiverId = message.receiver.toString();
        await message.deleteOne();

        if (req.io) {
            const roomName = `dm-${[senderId, receiverId].sort().join('-')}`;
            req.io.to(roomName).emit('messageDeleted', {
                messageId,
                senderId,
                receiverId
            });
        }

        res.status(200).json({ ok: true, messageId });
    } catch (error) {
        console.error('Error deleting message:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @route   PUT /api/messages/clear/:otherUserId
// @desc    Clear a conversation for the current user
router.put('/clear/:otherUserId', protect, async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const userId = req.user._id;
        const query = {
            $or: [
                { sender: userId, receiver: otherUserId },
                { sender: otherUserId, receiver: userId }
            ]
        };
        const result = await Message.updateMany(query, { $addToSet: { deletedFor: userId } });
        res.status(200).json({ ok: true, modified: result.modifiedCount });
    } catch (error) {
        console.error('Error clearing conversation:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
