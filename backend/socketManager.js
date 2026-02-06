import cloudinary from './config/cloudinary.js';
import Message from './models/messageModel.js';
import TribeMessage from './models/tribeMessageModel.js';
import Tribe from './models/tribeModel.js';
import User from './models/userModel.js';

let onlineUsers = new Map(); // Map<userId, socketId>

// Helper to get socketId by userId
export const getSocketId = (userId) => onlineUsers.get(userId.toString());

export const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId;

    if (userId) {
      // If user was already connected with another socket, update it
      onlineUsers.set(userId, socket.id);
      // Join a personal room for specific notifications (user-scoped events)
      socket.join(`user-${userId}`);
    }

    // Broadcast the updated list of online users to everyone
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));

    // Heartbeat to keep connection alive on services like Render
    socket.on('ping', (callback) => {
      callback();
    });

    // Room joining/leaving with ACK
    socket.on('joinRoom', (roomName) => {
      if (!roomName) return;
      socket.join(roomName);
    });

    socket.on('leaveRoom', (roomName) => {
      if (!roomName) return;
      socket.leave(roomName);
    });

    // Typing indicators
    socket.on('typing', ({ roomId, userName, userId }) => {
      if (!roomId) return;
      // Broadcast to everyone in the room EXCEPT the sender
      socket.to(roomId).emit('userTyping', { userName, userId });
    });

    socket.on('stopTyping', ({ roomId, userName, userId }) => {
      if (!roomId) return;
      socket.to(roomId).emit('userStoppedTyping', { userName, userId });
    });

    socket.on('sendMessage', async (payload, callback) => {
      if (!userId) {
        callback?.({ ok: false, error: 'Unauthorized' });
        return;
      }

      try {
        const { receiverId, message, imageUrl, attachment, tempId } = payload || {};

        if (!receiverId) {
          callback?.({ ok: false, error: 'Missing receiver' });
          return;
        }

        const receiver = await User.findById(receiverId).select('isDisabled');
        if (!receiver) {
          callback?.({ ok: false, error: 'User not found' });
          return;
        }
        if (receiver.isDisabled) {
          callback?.({ ok: false, error: 'User is disabled.' });
          return;
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
          callback?.({ ok: false, error: 'Message cannot be empty.' });
          return;
        }

        const newMessage = new Message({
          sender: userId,
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
          tempId
        };

        const roomName = `dm-${[userId.toString(), receiverId].sort().join('-')}`;
        io.to(roomName).emit('newMessage', responseMessage);
        io.to(`user-${receiverId}`).emit('newMessage', responseMessage);

        callback?.({ ok: true, message: responseMessage });
      } catch (error) {
        callback?.({ ok: false, error: 'Failed to send message.' });
      }
    });

    socket.on('sendTribeMessage', async (payload, callback) => {
      if (!userId) {
        callback?.({ ok: false, error: 'Unauthorized' });
        return;
      }

      try {
        const { tribeId, text, imageUrl, attachment, tempId } = payload || {};

        if (!tribeId) {
          callback?.({ ok: false, error: 'Missing tribe id' });
          return;
        }

        const tribe = await Tribe.findById(tribeId);
        if (!tribe) {
          callback?.({ ok: false, error: 'Tribe not found' });
          return;
        }

        const isMember = tribe.members.some(id => id.toString() === userId.toString());
        if (!isMember) {
          callback?.({ ok: false, error: 'Must be a member' });
          return;
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

        if (!text && !imageUrl && !attachment?.data) {
          callback?.({ ok: false, error: 'Message cannot be empty' });
          return;
        }

        const message = await TribeMessage.create({
          tribe: tribe._id,
          sender: userId,
          text: text || '',
          imageUrl: imageUrl || (attachmentType?.startsWith('image/') ? attachmentUrl : null),
          attachmentUrl,
          attachmentType,
          attachmentName,
          attachmentSize
        });

        const populated = await message.populate('sender', 'name username avatarUrl');

        const responseMessage = {
          id: populated._id.toString(),
          tempId,
          tribeId: tribe._id.toString(),
          sender: populated.sender,
          senderId: userId,
          text: populated.text,
          imageUrl: populated.imageUrl,
          attachmentUrl: populated.attachmentUrl,
          attachmentType: populated.attachmentType,
          attachmentName: populated.attachmentName,
          attachmentSize: populated.attachmentSize,
          timestamp: populated.createdAt
        };

        const roomName = tribe._id.toString();
        io.to(roomName).emit('newTribeMessage', responseMessage);

        tribe.members.forEach(memberId => {
          const mId = memberId.toString();
          if (mId !== userId) {
            io.to(`user-${mId}`).emit('tribeUnread', { tribeId: tribe._id.toString() });
          }
        });

        callback?.({ ok: true, message: responseMessage });
      } catch (error) {
        callback?.({ ok: false, error: 'Failed to send message.' });
      }
    });


    // Handle disconnection
    socket.on("disconnect", () => {
      // Only remove user if THIS specific socket was the one logged in
      // (Handles case where user has multiple tabs and closes one)
      if (userId && onlineUsers.get(userId) === socket.id) {
        onlineUsers.delete(userId);
        io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
      }
    });
  });

  return onlineUsers;
};
