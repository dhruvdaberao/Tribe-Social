import express from 'express';
import Message from '../models/messageModel.js';
import protect from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';

const router = express.Router();

const getConvoId = (id1, id2) => [id1.toString(), id2.toString()].sort().join('-');

// @route   GET /api/messages/conversations
router.get('/conversations', protect, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        
        // Fast aggregation for conversation list with last message only
        const conversations = await Message.aggregate([
            { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$conversationId",
                    lastMessage: { $first: "$message" },
                    timestamp: { $first: "$createdAt" },
                    p1: { $first: "$sender" },
                    p2: { $first: "$receiver" }
                }
            },
            { $sort: { timestamp: -1 } },
            {
                $lookup: {
                    from: 'users',
                    let: { p1: "$p1", p2: "$p2", cur: userId },
                    pipeline: [
                        { $match: { $expr: { 
                            $and: [
                                { $or: [{ $eq: ["$_id", "$$p1"] }, { $eq: ["$_id", "$$p2"] }] },
                                { $ne: ["$_id", "$$cur"] }
                            ]
                        }}},
                        { $project: { name: 1, username: 1, avatarUrl: 1 } }
                    ],
                    as: 'otherUser'
                }
            },
            { $unwind: "$otherUser" }
        ]);
        
        const results = conversations.map(c => ({
            id: c._id,
            otherUser: {
                id: c.otherUser._id.toString(),
                ...c.otherUser
            },
            lastMessage: c.lastMessage,
            timestamp: c.timestamp,
            participants: [{ id: userId.toString() }, { id: c.otherUser._id.toString() }]
        }));

        res.json(results);
    } catch (error) {
        console.error("Convo list error:", error);
        res.status(500).json([]);
    }
});

// @route   POST /api/messages/send/:receiverId
router.post('/send/:receiverId', protect, async (req, res) => {
    try {
        const { message, imageUrl } = req.body;
        const { receiverId } = req.params;
        const senderId = req.user._id;
        const conversationId = getConvoId(senderId, receiverId);

        if (!message && !imageUrl) return res.status(400).json({ message: "Empty message" });

        const newMessage = new Message({
            conversationId,
            sender: senderId,
            receiver: receiverId,
            message: message || "Sent an image",
            imageUrl: imageUrl || null
        });

        await newMessage.save();
        const responseMessage = newMessage.toJSON();

        if (req.io) {
            req.io.to(`dm-${conversationId}`).emit('newMessage', responseMessage);
            // Also notify receiver in their private room if they aren't in the chat room
            req.io.to(receiverId.toString()).emit('newMessageNotification', responseMessage);
        }
        
        res.status(201).json(responseMessage);
    } catch (error) {
        res.status(500).json({ message: "Send failed" });
    }
});

router.get('/:userToChatId', protect, async (req, res) => {
    try {
        const conversationId = getConvoId(req.user._id, req.params.userToChatId);
        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .limit(50)
            .lean();

        res.json(messages.map(m => ({
            ...m,
            id: m._id.toString(),
            senderId: m.sender.toString(),
            receiverId: m.receiver.toString(),
            text: m.message,
            timestamp: m.createdAt 
        })));
    } catch (error) {
        res.status(500).json([]);
    }
});

export default router;