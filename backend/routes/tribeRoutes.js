



// // // // import express from 'express';
// // // // import protect from '../middleware/authMiddleware.js';
// // // // import Tribe from '../models/tribeModel.js';
// // // // import TribeMessage from '../models/tribeMessageModel.js';
// // // // import User from '../models/userModel.js';
// // // // import Notification from '../models/notificationModel.js';

// // // // const router = express.Router();

// // // // // @route   POST /api/tribes
// // // // // @desc    Create a new tribe
// // // // router.post('/', protect, async (req, res) => {
// // // //     const { name, description, avatarUrl } = req.body;
// // // //     if (!name || !description) {
// // // //         return res.status(400).json({ message: 'Please provide a name and description' });
// // // //     }
// // // //     try {
// // // //         const tribeExists = await Tribe.findOne({ name });
// // // //         if (tribeExists) {
// // // //             return res.status(400).json({ message: 'A tribe with this name already exists' });
// // // //         }
// // // //         const tribe = new Tribe({
// // // //             name,
// // // //             description,
// // // //             avatarUrl,
// // // //             owner: req.user.id,
// // // //             members: [req.user.id],
// // // //         });
// // // //         const createdTribe = await tribe.save();
// // // //         res.status(201).json(createdTribe);
// // // //     } catch (error) {
// // // //         console.error('Error creating tribe:', error);
// // // //         res.status(500).json({ message: 'Server Error' });
// // // //     }
// // // // });

// // // // // @route   GET /api/tribes
// // // // // @desc    Get all tribes
// // // // router.get('/', protect, async (req, res) => {
// // // //     try {
// // // //         const tribes = await Tribe.find({}).sort({ createdAt: -1 });
// // // //         res.json(tribes);
// // // //     } catch (error) {
// // // //         res.status(500).json({ message: 'Server Error' });
// // // //     }
// // // // });

// // // // // @route   PUT /api/tribes/:id
// // // // // @desc    Update a tribe
// // // // router.put('/:id', protect, async (req, res) => {
// // // //     const { name, description, avatarUrl } = req.body;
// // // //     try {
// // // //         const tribe = await Tribe.findById(req.params.id);
// // // //         if (!tribe) {
// // // //             return res.status(404).json({ message: 'Tribe not found' });
// // // //         }
// // // //         if (tribe.owner.toString() !== req.user.id) {
// // // //             return res.status(401).json({ message: 'User not authorized' });
// // // //         }
// // // //         tribe.name = name || tribe.name;
// // // //         tribe.description = description || tribe.description;
// // // //         if (avatarUrl !== undefined) {
// // // //           tribe.avatarUrl = avatarUrl;
// // // //         }
// // // //         const updatedTribe = await tribe.save();
// // // //         res.json(updatedTribe);
// // // //     } catch (error) {
// // // //         res.status(500).json({ message: 'Server Error' });
// // // //     }
// // // // });

// // // // // @route   DELETE /api/tribes/:id
// // // // // @desc    Delete a tribe
// // // // router.delete('/:id', protect, async (req, res) => {
// // // //     try {
// // // //         const tribe = await Tribe.findById(req.params.id);
// // // //         if (!tribe) {
// // // //             return res.status(404).json({ message: 'Tribe not found' });
// // // //         }
// // // //         if (tribe.owner.toString() !== req.user.id) {
// // // //             return res.status(401).json({ message: 'Only the owner can delete this tribe' });
// // // //         }

// // // //         await TribeMessage.deleteMany({ tribe: tribe._id });
// // // //         await tribe.deleteOne();

// // // //         req.io.emit('tribeDeleted', req.params.id);

// // // //         res.json({ message: 'Tribe deleted successfully' });
// // // //     } catch (error) {
// // // //         console.error('Error deleting tribe:', error);
// // // //         res.status(500).json({ message: 'Server Error' });
// // // //     }
// // // // });


// // // // // @route   PUT /api/tribes/:id/join
// // // // // @desc    Join or leave a tribe
// // // // router.put('/:id/join', protect, async (req, res) => {
// // // //     try {
// // // //         const tribe = await Tribe.findById(req.params.id);
// // // //         if (!tribe) {
// // // //             return res.status(404).json({ message: 'Tribe not found' });
// // // //         }
// // // //         const isMember = tribe.members.some(memberId => memberId.equals(req.user.id));
// // // //         if (isMember) {
// // // //              if (tribe.owner.equals(req.user.id)) {
// // // //                 return res.status(400).json({ message: 'Owner cannot leave the tribe' });
// // // //             }
// // // //             tribe.members = tribe.members.filter(memberId => !memberId.equals(req.user.id));
// // // //         } else {
// // // //             tribe.members.push(req.user.id);
// // // //             // Notify the tribe owner
// // // //             if (tribe.owner.toString() !== req.user.id) {
// // // //                 const notification = new Notification({
// // // //                     recipient: tribe.owner,
// // // //                     sender: req.user.id,
// // // //                     type: 'tribe_join',
// // // //                     tribeId: tribe._id,
// // // //                 });
// // // //                 await notification.save();
// // // //                 const populatedNotification = await notification.populate('sender', 'name username avatarUrl');
// // // //                 const recipientSocket = req.onlineUsers.get(tribe.owner.toString());
// // // //                 if (recipientSocket) {
// // // //                     req.io.to(recipientSocket).emit('newNotification', populatedNotification);
// // // //                 }
// // // //             }
// // // //         }
// // // //         await tribe.save();
// // // //         res.json(tribe);
// // // //     } catch (error) {
// // // //         res.status(500).json({ message: 'Server Error' });
// // // //     }
// // // // });

// // // // // @route   GET /api/tribes/:id/messages
// // // // // @desc    Get all messages for a tribe
// // // // router.get('/:id/messages', protect, async (req, res) => {
// // // //     try {
// // // //         const tribe = await Tribe.findById(req.params.id);
// // // //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
        
// // // //         if (!tribe.members.some(memberId => memberId.equals(req.user.id))) {
// // // //             return res.status(403).json({ message: 'You must be a member to view messages' });
// // // //         }
        
// // // //         const messages = await TribeMessage.find({ tribe: req.params.id })
// // // //             .sort({ createdAt: 'asc' });
        
// // // //         res.json(messages.map(m => m.toJSON()));

// // // //     } catch (error) {
// // // //         res.status(500).json({ message: 'Server Error' });
// // // //     }
// // // // });

// // // // // @route   POST /api/tribes/:id/messages
// // // // // @desc    Post a new message in a tribe
// // // // router.post('/:id/messages', protect, async (req, res) => {
// // // //     const { text, imageUrl } = req.body;
// // // //     if (!text && !imageUrl) {
// // // //         return res.status(400).json({ message: 'Message text or image is required' });
// // // //     }
// // // //     try {
// // // //         const tribe = await Tribe.findById(req.params.id);
// // // //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
// // // //         if (!tribe.members.some(memberId => memberId.equals(req.user.id))) {
// // // //             return res.status(403).json({ message: 'You must be a member to send messages' });
// // // //         }
// // // //         const message = new TribeMessage({
// // // //             tribe: req.params.id,
// // // //             sender: req.user.id,
// // // //             text,
// // // //             imageUrl: imageUrl || null
// // // //         });
// // // //         const savedMessage = await message.save();
// // // //         const responseMessage = savedMessage.toJSON();

// // // //         req.io.to(`tribe-${req.params.id}`).emit('newTribeMessage', responseMessage);

// // // //         res.status(201).json(responseMessage);
// // // //     } catch (error) {
// // // //         res.status(500).json({ message: 'Server Error' });
// // // //     }
// // // // });

// // // // // @route   DELETE /api/tribes/:tribeId/messages/:messageId
// // // // // @desc    Delete a message in a tribe
// // // // router.delete('/:tribeId/messages/:messageId', protect, async (req, res) => {
// // // //     try {
// // // //         const { tribeId, messageId } = req.params;
// // // //         const message = await TribeMessage.findById(messageId);

// // // //         if (!message) {
// // // //             return res.status(404).json({ message: 'Message not found' });
// // // //         }

// // // //         if (message.sender.toString() !== req.user.id) {
// // // //             return res.status(403).json({ message: 'You can only delete your own messages' });
// // // //         }

// // // //         await message.deleteOne();

// // // //         req.io.to(`tribe-${tribeId}`).emit('tribeMessageDeleted', { tribeId, messageId });

// // // //         res.json({ message: 'Message deleted successfully' });
// // // //     } catch (error) {
// // // //         res.status(500).json({ message: 'Server Error' });
// // // //     }
// // // // });

// // // // export default router;




// // // // import express from 'express';
// // // // import protect from '../middleware/authMiddleware.js';
// // // // import Tribe from '../models/tribeModel.js';
// // // // import TribeMessage from '../models/tribeMessageModel.js';
// // // // import User from '../models/userModel.js';
// // // // import Notification from '../models/notificationModel.js';

// // // // const router = express.Router();

// // // // // Create Tribe
// // // // router.post('/', protect, async (req, res) => {
// // // //     const { name, description, avatarUrl } = req.body;
// // // //     if (!name || !description) return res.status(400).json({ message: 'Fields required' });
// // // //     try {
// // // //         const tribeExists = await Tribe.findOne({ name });
// // // //         if (tribeExists) return res.status(400).json({ message: 'Name taken' });
// // // //         const tribe = new Tribe({
// // // //             name, description, avatarUrl, owner: req.user.id, members: [req.user.id],
// // // //         });
// // // //         await tribe.save();
// // // //         res.status(201).json(tribe);
// // // //     } catch (error) {
// // // //         res.status(500).json({ message: 'Server Error' });
// // // //     }
// // // // });

// // // // // Get Tribes
// // // // router.get('/', protect, async (req, res) => {
// // // //     try {
// // // //         const tribes = await Tribe.find({}).sort({ createdAt: -1 });
// // // //         res.json(tribes);
// // // //     } catch (error) {
// // // //         res.status(500).json({ message: 'Server Error' });
// // // //     }
// // // // });

// // // // // Update Tribe
// // // // router.put('/:id', protect, async (req, res) => {
// // // //     try {
// // // //         const tribe = await Tribe.findById(req.params.id);
// // // //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
// // // //         if (tribe.owner.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });
        
// // // //         tribe.name = req.body.name || tribe.name;
// // // //         tribe.description = req.body.description || tribe.description;
// // // //         if (req.body.avatarUrl !== undefined) tribe.avatarUrl = req.body.avatarUrl;
        
// // // //         await tribe.save();
// // // //         res.json(tribe);
// // // //     } catch (error) {
// // // //         res.status(500).json({ message: 'Server Error' });
// // // //     }
// // // // });

// // // // // Delete Tribe
// // // // router.delete('/:id', protect, async (req, res) => {
// // // //     try {
// // // //         const tribe = await Tribe.findById(req.params.id);
// // // //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
// // // //         if (tribe.owner.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });

// // // //         await TribeMessage.deleteMany({ tribe: tribe._id });
// // // //         await tribe.deleteOne();
// // // //         req.io.emit('tribeDeleted', req.params.id);
// // // //         res.json({ message: 'Deleted' });
// // // //     } catch (error) {
// // // //         res.status(500).json({ message: 'Server Error' });
// // // //     }
// // // // });

// // // // // Join/Leave
// // // // router.put('/:id/join', protect, async (req, res) => {
// // // //     try {
// // // //         const tribe = await Tribe.findById(req.params.id);
// // // //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
// // // //         const isMember = tribe.members.some(id => id.equals(req.user.id));
        
// // // //         if (isMember) {
// // // //              if (tribe.owner.equals(req.user.id)) return res.status(400).json({ message: 'Owner cannot leave' });
// // // //             tribe.members = tribe.members.filter(id => !id.equals(req.user.id));
// // // //         } else {
// // // //             tribe.members.push(req.user.id);
// // // //             if (tribe.owner.toString() !== req.user.id) {
// // // //                 const notif = new Notification({ recipient: tribe.owner, sender: req.user.id, type: 'tribe_join', tribeId: tribe._id });
// // // //                 await notif.save();
// // // //                 const popNotif = await notif.populate('sender', 'name username avatarUrl');
// // // //                 const socketId = req.onlineUsers.get(tribe.owner.toString());
// // // //                 if (socketId) req.io.to(socketId).emit('newNotification', popNotif);
// // // //             }
// // // //         }
// // // //         await tribe.save();
// // // //         res.json(tribe);
// // // //     } catch (error) {
// // // //         res.status(500).json({ message: 'Server Error' });
// // // //     }
// // // // });

// // // // // Get Messages
// // // // router.get('/:id/messages', protect, async (req, res) => {
// // // //     try {
// // // //         const tribe = await Tribe.findById(req.params.id);
// // // //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
// // // //         if (!tribe.members.some(id => id.equals(req.user.id))) return res.status(403).json({ message: 'Access denied' });
        
// // // //         // Populate sender info. Crucial for displaying avatars in chat.
// // // //         const messages = await TribeMessage.find({ tribe: req.params.id })
// // // //             .populate('sender', 'name username avatarUrl')
// // // //             .sort({ createdAt: 1 }); // Sort oldest to newest
        
// // // //         res.json(messages);
// // // //     } catch (error) {
// // // //         console.error("Get messages error", error);
// // // //         res.status(500).json({ message: 'Server Error' });
// // // //     }
// // // // });

// // // // // Post Message
// // // // router.post('/:id/messages', protect, async (req, res) => {
// // // //     if (!req.body.text && !req.body.imageUrl) return res.status(400).json({ message: 'Content required' });
// // // //     try {
// // // //         const tribe = await Tribe.findById(req.params.id);
// // // //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
// // // //         if (!tribe.members.some(id => id.equals(req.user.id))) return res.status(403).json({ message: 'Access denied' });
        
// // // //         const message = new TribeMessage({
// // // //             tribe: req.params.id,
// // // //             sender: req.user.id,
// // // //             text: req.body.text,
// // // //             imageUrl: req.body.imageUrl || null
// // // //         });
        
// // // //         await message.save();
// // // //         const populatedMessage = await message.populate('sender', 'name username avatarUrl');

// // // //         req.io.to(`tribe-${req.params.id}`).emit('newTribeMessage', populatedMessage);
// // // //         res.status(201).json(populatedMessage);
// // // //     } catch (error) {
// // // //         res.status(500).json({ message: 'Server Error' });
// // // //     }
// // // // });

// // // // // Delete Message
// // // // router.delete('/:tribeId/messages/:messageId', protect, async (req, res) => {
// // // //     try {
// // // //         const message = await TribeMessage.findById(req.params.messageId);
// // // //         if (!message) return res.status(404).json({ message: 'Not found' });
// // // //         if (message.sender.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

// // // //         await message.deleteOne();
// // // //         req.io.to(`tribe-${req.params.tribeId}`).emit('tribeMessageDeleted', { tribeId: req.params.tribeId, messageId: req.params.messageId });
// // // //         res.json({ message: 'Deleted' });
// // // //     } catch (error) {
// // // //         res.status(500).json({ message: 'Server Error' });
// // // //     }
// // // // });

// // // // export default router;






// // // import express from 'express';
// // // import protect from '../middleware/authMiddleware.js';
// // // import Tribe from '../models/tribeModel.js';
// // // import TribeMessage from '../models/tribeMessageModel.js';
// // // import User from '../models/userModel.js';
// // // import Notification from '../models/notificationModel.js';

// // // const router = express.Router();

// // // // Create Tribe
// // // router.post('/', protect, async (req, res) => {
// // //     const { name, description, avatarUrl } = req.body;
// // //     if (!name || !description) return res.status(400).json({ message: 'Fields required' });
// // //     try {
// // //         const tribeExists = await Tribe.findOne({ name });
// // //         if (tribeExists) return res.status(400).json({ message: 'Name taken' });
// // //         const tribe = new Tribe({ name, description, avatarUrl, owner: req.user.id, members: [req.user.id] });
// // //         await tribe.save();
// // //         res.status(201).json(tribe);
// // //     } catch (error) { res.status(500).json({ message: 'Server Error' }); }
// // // });

// // // // Get Tribes
// // // router.get('/', protect, async (req, res) => {
// // //     try { const tribes = await Tribe.find({}).sort({ createdAt: -1 }); res.json(tribes); } catch (error) { res.status(500).json({ message: 'Server Error' }); }
// // // });

// // // // Update Tribe
// // // router.put('/:id', protect, async (req, res) => {
// // //     try {
// // //         const tribe = await Tribe.findById(req.params.id);
// // //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
// // //         if (tribe.owner.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });
// // //         tribe.name = req.body.name || tribe.name;
// // //         tribe.description = req.body.description || tribe.description;
// // //         if (req.body.avatarUrl !== undefined) tribe.avatarUrl = req.body.avatarUrl;
// // //         await tribe.save();
// // //         res.json(tribe);
// // //     } catch (error) { res.status(500).json({ message: 'Server Error' }); }
// // // });

// // // // Delete Tribe
// // // router.delete('/:id', protect, async (req, res) => {
// // //     try {
// // //         const tribe = await Tribe.findById(req.params.id);
// // //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
// // //         if (tribe.owner.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });
// // //         await TribeMessage.deleteMany({ tribe: tribe._id });
// // //         await tribe.deleteOne();
// // //         req.io.emit('tribeDeleted', req.params.id);
// // //         res.json({ message: 'Deleted' });
// // //     } catch (error) { res.status(500).json({ message: 'Server Error' }); }
// // // });

// // // // Join/Leave Tribe
// // // router.put('/:id/join', protect, async (req, res) => {
// // //     try {
// // //         const tribe = await Tribe.findById(req.params.id);
// // //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
// // //         const isMember = tribe.members.some(id => id.equals(req.user.id));
// // //         if (isMember) {
// // //              if (tribe.owner.equals(req.user.id)) return res.status(400).json({ message: 'Owner cannot leave' });
// // //             tribe.members = tribe.members.filter(id => !id.equals(req.user.id));
// // //         } else {
// // //             tribe.members.push(req.user.id);
// // //             if (tribe.owner.toString() !== req.user.id) {
// // //                 const notif = new Notification({ recipient: tribe.owner, sender: req.user.id, type: 'tribe_join', tribeId: tribe._id });
// // //                 await notif.save();
// // //                 const popNotif = await notif.populate('sender', 'name username avatarUrl');
// // //                 const socketId = req.onlineUsers.get(tribe.owner.toString());
// // //                 if (socketId) req.io.to(socketId).emit('newNotification', popNotif);
// // //             }
// // //         }
// // //         await tribe.save();
// // //         res.json(tribe);
// // //     } catch (error) { res.status(500).json({ message: 'Server Error' }); }
// // // });

// // // // Get Tribe Messages
// // // router.get('/:id/messages', protect, async (req, res) => {
// // //     try {
// // //         const tribe = await Tribe.findById(req.params.id);
// // //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
// // //         if (!tribe.members.some(id => id.equals(req.user.id))) return res.status(403).json({ message: 'Access denied' });
// // //         const messages = await TribeMessage.find({ tribe: req.params.id }).populate('sender', 'name username avatarUrl').sort({ createdAt: 1 });
// // //         res.json(messages);
// // //     } catch (error) { res.status(500).json({ message: 'Server Error' }); }
// // // });

// // // // Post Tribe Message
// // // router.post('/:id/messages', protect, async (req, res) => {
// // //     if (!req.body.text && !req.body.imageUrl) return res.status(400).json({ message: 'Content required' });
// // //     try {
// // //         const tribe = await Tribe.findById(req.params.id);
// // //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
// // //         if (!tribe.members.some(id => id.equals(req.user.id))) return res.status(403).json({ message: 'Access denied' });
        
// // //         const message = new TribeMessage({
// // //             tribe: req.params.id,
// // //             sender: req.user.id,
// // //             text: req.body.text,
// // //             imageUrl: req.body.imageUrl || null
// // //         });
        
// // //         const savedMessage = await message.save();
        
// // //         // CRITICAL FIX: Fully populate the sender so the frontend receives avatar/name immediately
// // //         const populatedMessage = await TribeMessage.findById(savedMessage._id)
// // //             .populate('sender', 'name username avatarUrl');

// // //         req.io.to(`tribe-${req.params.id}`).emit('newTribeMessage', populatedMessage);
// // //         res.status(201).json(populatedMessage);
// // //     } catch (error) {
// // //         console.error("Post tribe message error:", error);
// // //         res.status(500).json({ message: 'Server Error' });
// // //     }
// // // });

// // // // Delete Tribe Message
// // // router.delete('/:tribeId/messages/:messageId', protect, async (req, res) => {
// // //     try {
// // //         const message = await TribeMessage.findById(req.params.messageId);
// // //         if (!message) return res.status(404).json({ message: 'Not found' });
// // //         if (message.sender.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
// // //         await message.deleteOne();
// // //         req.io.to(`tribe-${req.params.tribeId}`).emit('tribeMessageDeleted', { tribeId: req.params.tribeId, messageId: req.params.messageId });
// // //         res.json({ message: 'Deleted' });
// // //     } catch (error) { res.status(500).json({ message: 'Server Error' }); }
// // // });

// // // export default router;






// // import express from 'express';
// // import protect from '../middleware/authMiddleware.js';
// // import Tribe from '../models/tribeModel.js';
// // import TribeMessage from '../models/tribeMessageModel.js';
// // import User from '../models/userModel.js';
// // import Notification from '../models/notificationModel.js';

// // const router = express.Router();

// // // @route   POST /api/tribes
// // // @desc    Create a new tribe
// // router.post('/', protect, async (req, res) => {
// //     const { name, description, avatarUrl } = req.body;
// //     if (!name || !description) {
// //         return res.status(400).json({ message: 'Please provide a name and description' });
// //     }
// //     try {
// //         const tribeExists = await Tribe.findOne({ name });
// //         if (tribeExists) {
// //             return res.status(400).json({ message: 'A tribe with this name already exists' });
// //         }
// //         const tribe = new Tribe({
// //             name,
// //             description,
// //             avatarUrl,
// //             owner: req.user.id,
// //             members: [req.user.id],
// //         });
// //         const createdTribe = await tribe.save();
// //         res.status(201).json(createdTribe);
// //     } catch (error) {
// //         console.error('Error creating tribe:', error);
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });

// // // @route   GET /api/tribes
// // // @desc    Get all tribes (Cached on frontend)
// // router.get('/', protect, async (req, res) => {
// //     try {
// //         // Limit response size if needed, but tribes are generally fewer than posts
// //         const tribes = await Tribe.find({}).sort({ createdAt: -1 });
// //         res.json(tribes);
// //     } catch (error) {
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });

// // // @route   PUT /api/tribes/:id
// // router.put('/:id', protect, async (req, res) => {
// //     const { name, description, avatarUrl } = req.body;
// //     try {
// //         const tribe = await Tribe.findById(req.params.id);
// //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
// //         if (tribe.owner.toString() !== req.user.id) {
// //             return res.status(401).json({ message: 'User not authorized' });
// //         }
// //         tribe.name = name || tribe.name;
// //         tribe.description = description || tribe.description;
// //         if (avatarUrl !== undefined) tribe.avatarUrl = avatarUrl;
        
// //         const updatedTribe = await tribe.save();
// //         res.json(updatedTribe);
// //     } catch (error) {
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });

// // // @route   DELETE /api/tribes/:id
// // router.delete('/:id', protect, async (req, res) => {
// //     try {
// //         const tribe = await Tribe.findById(req.params.id);
// //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
// //         if (tribe.owner.toString() !== req.user.id) {
// //             return res.status(401).json({ message: 'Only the owner can delete this tribe' });
// //         }

// //         await TribeMessage.deleteMany({ tribe: tribe._id });
// //         await tribe.deleteOne();

// //         req.io.emit('tribeDeleted', req.params.id);
// //         res.json({ message: 'Tribe deleted successfully' });
// //     } catch (error) {
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });


// // // @route   PUT /api/tribes/:id/join
// // router.put('/:id/join', protect, async (req, res) => {
// //     try {
// //         const tribe = await Tribe.findById(req.params.id);
// //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
        
// //         const isMember = tribe.members.some(memberId => memberId.equals(req.user.id));
// //         if (isMember) {
// //              if (tribe.owner.equals(req.user.id)) {
// //                 return res.status(400).json({ message: 'Owner cannot leave the tribe' });
// //             }
// //             tribe.members = tribe.members.filter(memberId => !memberId.equals(req.user.id));
// //         } else {
// //             tribe.members.push(req.user.id);
// //             // Notify owner
// //             if (tribe.owner.toString() !== req.user.id) {
// //                 const notification = new Notification({
// //                     recipient: tribe.owner,
// //                     sender: req.user.id,
// //                     type: 'tribe_join',
// //                     tribeId: tribe._id,
// //                 });
// //                 await notification.save();
// //                 const populatedNotification = await notification.populate('sender', 'name username avatarUrl');
// //                 const recipientSocket = req.onlineUsers.get(tribe.owner.toString());
// //                 if (recipientSocket) {
// //                     req.io.to(recipientSocket).emit('newNotification', populatedNotification);
// //                 }
// //             }
// //         }
// //         await tribe.save();
// //         res.json(tribe);
// //     } catch (error) {
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });

// // // @route   GET /api/tribes/:id/messages
// // router.get('/:id/messages', protect, async (req, res) => {
// //     try {
// //         const tribe = await Tribe.findById(req.params.id);
// //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
        
// //         if (!tribe.members.some(memberId => memberId.equals(req.user.id))) {
// //             return res.status(403).json({ message: 'You must be a member to view messages' });
// //         }
        
// //         const messages = await TribeMessage.find({ tribe: req.params.id })
// //             .populate('sender', 'name username avatarUrl') // Populate sender for existing messages
// //             .sort({ createdAt: 'asc' });
        
// //         res.json(messages.map(m => m.toJSON()));

// //     } catch (error) {
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });

// // // @route   POST /api/tribes/:id/messages
// // router.post('/:id/messages', protect, async (req, res) => {
// //     const { text, imageUrl } = req.body;
// //     if (!text && !imageUrl) {
// //         return res.status(400).json({ message: 'Message text or image is required' });
// //     }
// //     try {
// //         const tribe = await Tribe.findById(req.params.id);
// //         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
// //         if (!tribe.members.some(memberId => memberId.equals(req.user.id))) {
// //             return res.status(403).json({ message: 'You must be a member to send messages' });
// //         }
        
// //         const message = new TribeMessage({
// //             tribe: req.params.id,
// //             sender: req.user.id,
// //             text,
// //             imageUrl: imageUrl || null
// //         });
        
// //         let savedMessage = await message.save();
        
// //         // CRITICAL FIX: Fully populate the sender before sending to socket
// //         // This ensures the frontend receives 'name' and 'avatarUrl' immediately
// //         savedMessage = await savedMessage.populate('sender', 'name username avatarUrl');
        
// //         const responseMessage = savedMessage.toJSON();

// //         req.io.to(`tribe-${req.params.id}`).emit('newTribeMessage', responseMessage);

// //         res.status(201).json(responseMessage);
// //     } catch (error) {
// //         console.error("Error sending tribe message:", error);
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });

// // // @route   DELETE /api/tribes/:tribeId/messages/:messageId
// // router.delete('/:tribeId/messages/:messageId', protect, async (req, res) => {
// //     try {
// //         const { tribeId, messageId } = req.params;
// //         const message = await TribeMessage.findById(messageId);

// //         if (!message) return res.status(404).json({ message: 'Message not found' });

// //         if (message.sender.toString() !== req.user.id) {
// //             return res.status(403).json({ message: 'You can only delete your own messages' });
// //         }

// //         await message.deleteOne();

// //         req.io.to(`tribe-${tribeId}`).emit('tribeMessageDeleted', { tribeId, messageId });

// //         res.json({ message: 'Message deleted successfully' });
// //     } catch (error) {
// //         res.status(500).json({ message: 'Server Error' });
// //     }
// // });

// // export default router;





// import express from 'express';
// import protect from '../middleware/authMiddleware.js';
// import Tribe from '../models/tribeModel.js';
// import TribeMessage from '../models/tribeMessageModel.js';
// import User from '../models/userModel.js';
// import Notification from '../models/notificationModel.js';

// const router = express.Router();

// // @route   POST /api/tribes
// // @desc    Create a new tribe
// router.post('/', protect, async (req, res) => {
//     const { name, description, avatarUrl } = req.body;
//     if (!name || !description) {
//         return res.status(400).json({ message: 'Please provide a name and description' });
//     }
//     try {
//         const tribeExists = await Tribe.findOne({ name });
//         if (tribeExists) {
//             return res.status(400).json({ message: 'A tribe with this name already exists' });
//         }
//         const tribe = new Tribe({
//             name,
//             description,
//             avatarUrl,
//             owner: req.user.id,
//             members: [req.user.id],
//         });
//         const createdTribe = await tribe.save();
//         res.status(201).json(createdTribe);
//     } catch (error) {
//         console.error('Error creating tribe:', error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// // @route   GET /api/tribes
// // @desc    Get all tribes
// router.get('/', protect, async (req, res) => {
//     try {
//         const tribes = await Tribe.find({}).sort({ createdAt: -1 });
//         res.json(tribes);
//     } catch (error) {
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// // @route   PUT /api/tribes/:id
// router.put('/:id', protect, async (req, res) => {
//     const { name, description, avatarUrl } = req.body;
//     try {
//         const tribe = await Tribe.findById(req.params.id);
//         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
//         if (tribe.owner.toString() !== req.user.id) {
//             return res.status(401).json({ message: 'User not authorized' });
//         }
//         tribe.name = name || tribe.name;
//         tribe.description = description || tribe.description;
//         if (avatarUrl !== undefined) tribe.avatarUrl = avatarUrl;
        
//         const updatedTribe = await tribe.save();
//         res.json(updatedTribe);
//     } catch (error) {
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// // @route   DELETE /api/tribes/:id
// router.delete('/:id', protect, async (req, res) => {
//     try {
//         const tribe = await Tribe.findById(req.params.id);
//         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
//         if (tribe.owner.toString() !== req.user.id) {
//             return res.status(401).json({ message: 'Only the owner can delete this tribe' });
//         }

//         await TribeMessage.deleteMany({ tribe: tribe._id });
//         await tribe.deleteOne();

//         req.io.emit('tribeDeleted', req.params.id);
//         res.json({ message: 'Tribe deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ message: 'Server Error' });
//     }
// });


// // @route   PUT /api/tribes/:id/join
// router.put('/:id/join', protect, async (req, res) => {
//     try {
//         const tribe = await Tribe.findById(req.params.id);
//         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
        
//         const isMember = tribe.members.some(memberId => memberId.equals(req.user.id));
//         if (isMember) {
//              if (tribe.owner.equals(req.user.id)) {
//                 return res.status(400).json({ message: 'Owner cannot leave the tribe' });
//             }
//             tribe.members = tribe.members.filter(memberId => !memberId.equals(req.user.id));
//         } else {
//             tribe.members.push(req.user.id);
//             // Notify owner
//             if (tribe.owner.toString() !== req.user.id) {
//                 const notification = new Notification({
//                     recipient: tribe.owner,
//                     sender: req.user.id,
//                     type: 'tribe_join',
//                     tribeId: tribe._id,
//                 });
//                 await notification.save();
//                 const populatedNotification = await notification.populate('sender', 'name username avatarUrl');
//                 const recipientSocket = req.onlineUsers.get(tribe.owner.toString());
//                 if (recipientSocket) {
//                     req.io.to(recipientSocket).emit('newNotification', populatedNotification);
//                 }
//             }
//         }
//         await tribe.save();
//         res.json(tribe);
//     } catch (error) {
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// // @route   GET /api/tribes/:id/messages
// router.get('/:id/messages', protect, async (req, res) => {
//     try {
//         const tribe = await Tribe.findById(req.params.id);
//         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
        
//         if (!tribe.members.some(memberId => memberId.equals(req.user.id))) {
//             return res.status(403).json({ message: 'You must be a member to view messages' });
//         }
        
//         const messages = await TribeMessage.find({ tribe: req.params.id })
//             .populate('sender', 'name username avatarUrl') // Populate sender for existing messages
//             .sort({ createdAt: 'asc' });
        
//         res.json(messages.map(m => m.toJSON()));

//     } catch (error) {
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// // @route   POST /api/tribes/:id/messages
// router.post('/:id/messages', protect, async (req, res) => {
//     const { text, imageUrl } = req.body;
//     if (!text && !imageUrl) {
//         return res.status(400).json({ message: 'Message text or image is required' });
//     }
//     try {
//         const tribe = await Tribe.findById(req.params.id);
//         if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
//         if (!tribe.members.some(memberId => memberId.equals(req.user.id))) {
//             return res.status(403).json({ message: 'You must be a member to send messages' });
//         }
        
//         const message = new TribeMessage({
//             tribe: req.params.id,
//             sender: req.user.id,
//             text,
//             imageUrl: imageUrl || null
//         });
        
//         let savedMessage = await message.save();
        
//         // CRITICAL FIX: Fully populate the sender before sending to socket
//         // This ensures the frontend receives 'name' and 'avatarUrl' immediately
//         savedMessage = await savedMessage.populate('sender', 'name username avatarUrl');
        
//         const responseMessage = savedMessage.toJSON();

//         req.io.to(`tribe-${req.params.id}`).emit('newTribeMessage', responseMessage);

//         res.status(201).json(responseMessage);
//     } catch (error) {
//         console.error("Error sending tribe message:", error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// // @route   DELETE /api/tribes/:tribeId/messages/:messageId
// router.delete('/:tribeId/messages/:messageId', protect, async (req, res) => {
//     try {
//         const { tribeId, messageId } = req.params;
//         const message = await TribeMessage.findById(messageId);

//         if (!message) return res.status(404).json({ message: 'Message not found' });

//         if (message.sender.toString() !== req.user.id) {
//             return res.status(403).json({ message: 'You can only delete your own messages' });
//         }

//         await message.deleteOne();

//         req.io.to(`tribe-${tribeId}`).emit('tribeMessageDeleted', { tribeId, messageId });

//         res.json({ message: 'Message deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

// export default router;






import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Tribe from '../models/tribeModel.js';
import TribeMessage from '../models/tribeMessageModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';

const router = express.Router();

// @route   POST /api/tribes
// @desc    Create a new tribe
router.post('/', protect, async (req, res) => {
    const { name, description, avatarUrl } = req.body;
    if (!name || !description) {
        return res.status(400).json({ message: 'Please provide a name and description' });
    }
    try {
        const tribeExists = await Tribe.findOne({ name });
        if (tribeExists) {
            return res.status(400).json({ message: 'A tribe with this name already exists' });
        }
        const tribe = new Tribe({
            name,
            description,
            avatarUrl,
            owner: req.user.id,
            members: [req.user.id],
        });
        const createdTribe = await tribe.save();
        res.status(201).json(createdTribe);
    } catch (error) {
        console.error('Error creating tribe:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/tribes
// @desc    Get all tribes
// @route   GET /api/tribes
// @desc    Get all tribes
router.get('/', protect, async (req, res) => {
    try {
        console.log("----------------------------------");
        console.log("🔍 GET /api/tribes - Fetching tribes...");
        
        const query = {}; // Fetch ALL tribes (no filtering yet)
        console.log("❓ Query:", JSON.stringify(query));

        const tribes = await Tribe.find(query).sort({ createdAt: -1 });
        console.log(`✅ Found ${tribes.length} tribes.`);
        
        if (tribes.length === 0) {
            console.warn("⚠️ WARNING: No tribes found in DB. Returning empty array.");
        }

        res.json(tribes);
    } catch (error) {
        console.error("❌ Error fetching tribes:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/tribes/:id
router.put('/:id', protect, async (req, res) => {
    const { name, description, avatarUrl } = req.body;
    try {
        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
        if (tribe.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }
        tribe.name = name || tribe.name;
        tribe.description = description || tribe.description;
        if (avatarUrl !== undefined) tribe.avatarUrl = avatarUrl;
        
        const updatedTribe = await tribe.save();
        res.json(updatedTribe);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/tribes/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
        if (tribe.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Only the owner can delete this tribe' });
        }

        await TribeMessage.deleteMany({ tribe: tribe._id });
        await tribe.deleteOne();

        req.io.emit('tribeDeleted', req.params.id);
        res.json({ message: 'Tribe deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// @route   PUT /api/tribes/:id/join
router.put('/:id/join', protect, async (req, res) => {
    try {
        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
        
        const isMember = tribe.members.some(memberId => memberId.equals(req.user.id));
        if (isMember) {
             if (tribe.owner.equals(req.user.id)) {
                return res.status(400).json({ message: 'Owner cannot leave the tribe' });
            }
            tribe.members = tribe.members.filter(memberId => !memberId.equals(req.user.id));
        } else {
            tribe.members.push(req.user.id);
            // Notify owner
            if (tribe.owner.toString() !== req.user.id) {
                const notification = new Notification({
                    recipient: tribe.owner,
                    sender: req.user.id,
                    type: 'tribe_join',
                    tribeId: tribe._id,
                });
                await notification.save();
                const populatedNotification = await notification.populate('sender', 'name username avatarUrl');
                const recipientSocket = req.onlineUsers.get(tribe.owner.toString());
                if (recipientSocket) {
                    req.io.to(recipientSocket).emit('newNotification', populatedNotification);
                }
            }
        }
        await tribe.save();
        res.json(tribe);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/tribes/:id/messages
router.get('/:id/messages', protect, async (req, res) => {
    try {
        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
        
        if (!tribe.members.some(memberId => memberId.equals(req.user.id))) {
            return res.status(403).json({ message: 'You must be a member to view messages' });
        }
        
        const messages = await TribeMessage.find({ tribe: req.params.id })
            .populate('sender', 'name username avatarUrl') // Populate sender for existing messages
            .sort({ createdAt: 'asc' });
        
        res.json(messages.map(m => m.toJSON()));

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/tribes/:id/messages
router.post('/:id/messages', protect, async (req, res) => {
    const { text, imageUrl } = req.body;
    if (!text && !imageUrl) {
        return res.status(400).json({ message: 'Message text or image is required' });
    }
    try {
        const tribe = await Tribe.findById(req.params.id);
        if (!tribe) return res.status(404).json({ message: 'Tribe not found' });
        if (!tribe.members.some(memberId => memberId.equals(req.user.id))) {
            return res.status(403).json({ message: 'You must be a member to send messages' });
        }
        
        const message = new TribeMessage({
            tribe: req.params.id,
            sender: req.user.id,
            text,
            imageUrl: imageUrl || null
        });
        
        let savedMessage = await message.save();
        
        // CRITICAL FIX: Fully populate the sender before sending to socket
        // This ensures the frontend receives 'name' and 'avatarUrl' immediately
        savedMessage = await savedMessage.populate('sender', 'name username avatarUrl');
        
        const responseMessage = savedMessage.toJSON();

        req.io.to(`tribe-${req.params.id}`).emit('newTribeMessage', responseMessage);

        res.status(201).json(responseMessage);
    } catch (error) {
        console.error("Error sending tribe message:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/tribes/:tribeId/messages/:messageId
router.delete('/:tribeId/messages/:messageId', protect, async (req, res) => {
    try {
        const { tribeId, messageId } = req.params;
        const message = await TribeMessage.findById(messageId);

        if (!message) return res.status(404).json({ message: 'Message not found' });

        if (message.sender.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only delete your own messages' });
        }

        await message.deleteOne();

        req.io.to(`tribe-${tribeId}`).emit('tribeMessageDeleted', { tribeId, messageId });

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
