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
//         console.log("Error in getConversations controller: ", error.message);
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
//         console.log("Error in sendMessage controller: ", error.message);
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
//         console.log("Error in getMessages controller: ", error.message);
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
import { sendPushNotification, buildNotificationPayload } from '../services/pushNotificationService.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get all conversations for the current user
router.get('/conversations', protect, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const messages = await Message.aggregate([
            { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
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
        const { message, imageUrl, attachment } = req.body;
        const { receiverId } = req.params;
        const senderId = req.user._id;

        const receiver = await User.findById(receiverId).select('isDisabled');
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
            attachmentSize
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

        // Send push notification to receiver (if not online or not in chat)
        const isReceiverOnline = req.onlineUsers?.get(receiverId.toString());
        if (!isReceiverOnline) {
            const sender = await User.findById(senderId).select('name');
        const payload = buildNotificationPayload('message', {
            senderName: sender?.name || 'Someone',
            senderId: senderId.toString(),
            messagePreview: message?.slice(0, 50) + (message?.length > 50 ? '...' : '') || 'Sent an attachment',
            conversationId: `${senderId}-${receiverId}`
        });

            if (payload) {
                await sendPushNotification(receiverId.toString(), payload, 'message');
            }
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

export default router;
