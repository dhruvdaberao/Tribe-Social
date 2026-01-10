// // // import express from 'express';
// // // import Message from '../models/messageModel.js';
// // // import User from '../models/userModel.js';
// // // import protect from '../middleware/authMiddleware.js';
// // // import mongoose from 'mongoose';
// // // import Notification from '../models/notificationModel.js';

// // // const router = express.Router();

// // // // @route   GET /api/messages/conversations
// // // // @desc    Get all conversations for the current user
// // // router.get('/conversations', protect, async (req, res) => {
// // //     try {
// // //         const userId = new mongoose.Types.ObjectId(req.user.id);
        
// // //         const messages = await Message.aggregate([
// // //             { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
// // //             { $sort: { createdAt: -1 } },
// // //             {
// // //                 $group: {
// // //                     _id: {
// // //                         $cond: [
// // //                             { $gt: ["$sender", "$receiver"] },
// // //                             { sender: "$sender", receiver: "$receiver" },
// // //                             { sender: "$receiver", receiver: "$sender" }
// // //                         ]
// // //                     },
// // //                     lastMessage: { $first: "$message" },
// // //                     timestamp: { $first: "$createdAt" },
// // //                     docId: { $first: "$_id" }
// // //                 }
// // //             },
// // //              {
// // //                 $project: {
// // //                     _id: 0,
// // //                     conversationId: "$_id",
// // //                     lastMessage: "$lastMessage",
// // //                     timestamp: "$timestamp"
// // //                 }
// // //             },
// // //             { $sort: { timestamp: -1 } },
// // //         ]);
        
// // //         const conversations = messages.map(msg => {
// // //             const otherUserId = msg.conversationId.sender.equals(userId) ? msg.conversationId.receiver : msg.conversationId.sender;
// // //             return {
// // //                 id: `${msg.conversationId.sender}-${msg.conversationId.receiver}`, // A consistent ID
// // //                 participants: [{id: req.user.id}, {id: otherUserId.toString()}],
// // //                 lastMessage: msg.lastMessage,
// // //                 timestamp: msg.timestamp
// // //             };
// // //         });

// // //         res.status(200).json(conversations);

// // //     } catch (error) {
// // //         console.log("Error in getConversations controller: ", error.message);
// // //         res.status(500).json({ error: "Internal server error" });
// // //     }
// // // });


// // // // @route   POST /api/messages/send/:receiverId
// // // // @desc    Send a message to a user
// // // router.post('/send/:receiverId', protect, async (req, res) => {
// // //     try {
// // //         const { message, imageUrl } = req.body;
// // //         const { receiverId } = req.params;
// // //         const senderId = req.user._id;

// // //         const newMessage = new Message({
// // //             sender: senderId,
// // //             receiver: receiverId,
// // //             message,
// // //             imageUrl: imageUrl || null
// // //         });

// // //         await newMessage.save();

// // //         const responseMessage = newMessage.toJSON();

// // //         // Emit the message to the specific room for this DM
// // //         const roomName = `dm-${[senderId.toString(), receiverId].sort().join('-')}`;
// // //         req.io.to(roomName).emit('newMessage', responseMessage);

// // //         // Create and emit notification to the receiver
// // //         const notification = new Notification({
// // //             recipient: receiverId,
// // //             sender: senderId,
// // //             type: 'message',
// // //         });
// // //         await notification.save();
// // //         const populatedNotification = await notification.populate('sender', 'id name username avatarUrl');
        
// // //         const recipientSocketId = req.onlineUsers.get(receiverId.toString());
// // //         if (recipientSocketId) {
// // //             req.io.to(recipientSocketId).emit('newNotification', populatedNotification);
// // //         }
        
// // //         res.status(201).json(responseMessage);

// // //     } catch (error) {
// // //         console.log("Error in sendMessage controller: ", error.message);
// // //         res.status(500).json({ error: "Internal server error" });
// // //     }
// // // });

// // // // @route   GET /api/messages/:userToChatId
// // // // @desc    Get messages between current user and another user
// // // router.get('/:userToChatId', protect, async (req, res) => {
// // //     try {
// // //         const { userToChatId } = req.params;
// // //         const senderId = req.user._id;

// // //         const messages = await Message.find({
// // //             $or: [
// // //                 { sender: senderId, receiver: userToChatId },
// // //                 { sender: userToChatId, receiver: senderId },
// // //             ],
// // //         }).sort({ createdAt: 1 });

// // //         res.status(200).json(messages.map(m => m.toJSON()));

// // //     } catch (error) {
// // //         console.log("Error in getMessages controller: ", error.message);
// // //         res.status(500).json({ error: "Internal server error" });
// // //     }
// // // });

// // // export default router;







// // import express from 'express';
// // import Message from '../models/messageModel.js';
// // import User from '../models/userModel.js';
// // import protect from '../middleware/authMiddleware.js';
// // import mongoose from 'mongoose';
// // import Notification from '../models/notificationModel.js';

// // const router = express.Router();

// // // @route   GET /api/messages/conversations
// // // @desc    Get all conversations for the current user
// // router.get('/conversations', protect, async (req, res) => {
// //     try {
// //         const userId = new mongoose.Types.ObjectId(req.user.id);
        
// //         const messages = await Message.aggregate([
// //             { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
// //             { $sort: { createdAt: -1 } },
// //             {
// //                 $group: {
// //                     _id: {
// //                         $cond: [
// //                             { $gt: ["$sender", "$receiver"] },
// //                             { sender: "$sender", receiver: "$receiver" },
// //                             { sender: "$receiver", receiver: "$sender" }
// //                         ]
// //                     },
// //                     lastMessage: { $first: "$message" },
// //                     timestamp: { $first: "$createdAt" },
// //                     docId: { $first: "$_id" }
// //                 }
// //             },
// //              {
// //                 $project: {
// //                     _id: 0,
// //                     conversationId: "$_id",
// //                     lastMessage: "$lastMessage",
// //                     timestamp: "$timestamp"
// //                 }
// //             },
// //             { $sort: { timestamp: -1 } },
// //         ]);
        
// //         const conversations = messages.map(msg => {
// //             const otherUserId = msg.conversationId.sender.equals(userId) ? msg.conversationId.receiver : msg.conversationId.sender;
// //             return {
// //                 id: `${msg.conversationId.sender}-${msg.conversationId.receiver}`, // A consistent ID
// //                 participants: [{id: req.user.id}, {id: otherUserId.toString()}],
// //                 lastMessage: msg.lastMessage,
// //                 timestamp: msg.timestamp
// //             };
// //         });

// //         res.status(200).json(conversations);

// //     } catch (error) {
// //         console.log("Error in getConversations controller: ", error.message);
// //         res.status(500).json({ error: "Internal server error" });
// //     }
// // });


// // // @route   POST /api/messages/send/:receiverId
// // // @desc    Send a message to a user
// // router.post('/send/:receiverId', protect, async (req, res) => {
// //     try {
// //         const { message, imageUrl } = req.body;
// //         const { receiverId } = req.params;
// //         const senderId = req.user._id;

// //         const newMessage = new Message({
// //             sender: senderId,
// //             receiver: receiverId,
// //             message,
// //             imageUrl: imageUrl || null
// //         });

// //         await newMessage.save();

// //         const responseMessage = newMessage.toJSON();

// //         // Emit the message to the specific room for this DM
// //         const roomName = `dm-${[senderId.toString(), receiverId].sort().join('-')}`;
// //         req.io.to(roomName).emit('newMessage', responseMessage);
        
// //         // **REMOVED** Notification creation for DMs to avoid cluttering the main feed.
// //         // Unread count is handled on the client via the 'newMessage' socket event.

// //         res.status(201).json(responseMessage);

// //     } catch (error) {
// //         console.log("Error in sendMessage controller: ", error.message);
// //         res.status(500).json({ error: "Internal server error" });
// //     }
// // });

// // // @route   GET /api/messages/:userToChatId
// // // @desc    Get messages between current user and another user
// // router.get('/:userToChatId', protect, async (req, res) => {
// //     try {
// //         const { userToChatId } = req.params;
// //         const senderId = req.user._id;

// //         const messages = await Message.find({
// //             $or: [
// //                 { sender: senderId, receiver: userToChatId },
// //                 { sender: userToChatId, receiver: senderId },
// //             ],
// //         }).sort({ createdAt: 1 });

// //         res.status(200).json(messages.map(m => m.toJSON()));

// //     } catch (error) {
// //         console.log("Error in getMessages controller: ", error.message);
// //         res.status(500).json({ error: "Internal server error" });
// //     }
// // });

// // export default router;






// import express from 'express';
// import Message from '../models/messageModel.js';
// import User from '../models/userModel.js';
// import protect from '../middleware/authMiddleware.js';
// import mongoose from 'mongoose';

// const router = express.Router();

// // @route   GET /api/messages/conversations
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
//                             { p1: "$sender", p2: "$receiver" },
//                             { p1: "$receiver", p2: "$sender" }
//                         ]
//                     },
//                     lastMessage: { $first: "$message" },
//                     timestamp: { $first: "$createdAt" }
//                 }
//             },
//             { $sort: { timestamp: -1 } },
//             // NEW: Lookup user details for both potential participants
//             {
//                 $lookup: {
//                     from: 'users',
//                     localField: '_id.p1',
//                     foreignField: '_id',
//                     as: 'user1'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'users',
//                     localField: '_id.p2',
//                     foreignField: '_id',
//                     as: 'user2'
//                 }
//             },
//             { $unwind: '$user1' },
//             { $unwind: '$user2' }
//         ]);
        
//         const conversations = messages.map(msg => {
//             const isUser1 = msg.user1._id.equals(userId);
//             const otherUser = isUser1 ? msg.user2 : msg.user1;
            
//             return {
//                 id: `convo-${[userId.toString(), otherUser._id.toString()].sort().join('-')}`,
//                 // ENRICHED DATA: Return the full other user object
//                 otherUser: {
//                     id: otherUser._id.toString(),
//                     name: otherUser.name,
//                     username: otherUser.username,
//                     avatarUrl: otherUser.avatarUrl
//                 },
//                 participants: [{id: userId.toString()}, {id: otherUser._id.toString()}],
//                 lastMessage: msg.lastMessage,
//                 timestamp: msg.timestamp
//             };
//         });

//         res.status(200).json(conversations);
//     } catch (error) {
//         console.error("Error in getConversations:", error);
//         res.status(500).json([]);
//     }
// });

// // @route   POST /api/messages/send/:receiverId
// router.post('/send/:receiverId', protect, async (req, res) => {
//     try {
//         const { message, imageUrl } = req.body;
//         const { receiverId } = req.params;
//         const senderId = req.user._id;

//         if (!message && !imageUrl) {
//             return res.status(400).json({ message: "Message cannot be empty" });
//         }

//         const newMessage = new Message({
//             sender: senderId,
//             receiver: receiverId,
//             message: message || "Sent an image",
//             imageUrl: imageUrl || null
//         });

//         await newMessage.save();
//         const responseMessage = newMessage.toJSON();

//         const roomName = `dm-${[senderId.toString(), receiverId.toString()].sort().join('-')}`;
//         if (req.io) {
//             req.io.to(roomName).emit('newMessage', responseMessage);
//         }
        
//         res.status(201).json(responseMessage);
//     } catch (error) {
//         res.status(500).json({ message: "Failed to send message" });
//     }
// });

// router.get('/:userToChatId', protect, async (req, res) => {
//     try {
//         const { userToChatId } = req.params;
//         const senderId = req.user._id;
//         const messages = await Message.find({
//             $or: [
//                 { sender: senderId, receiver: userToChatId },
//                 { sender: userToChatId, receiver: senderId },
//             ],
//         }).sort({ createdAt: 1 }).lean();

//         res.status(200).json(messages.map(m => {
//             const doc = {...m, id: m._id.toString(), senderId: m.sender.toString(), receiverId: m.receiver.toString(), text: m.message, timestamp: m.createdAt };
//             delete doc._id;
//             return doc;
//         }));
//     } catch (error) {
//         res.status(500).json([]);
//     }
// });

// export default router;




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