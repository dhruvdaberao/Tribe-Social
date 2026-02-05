import Message from './models/messageModel.js';
import TribeMessage from './models/tribeMessageModel.js';
import Tribe from './models/tribeModel.js';
import User from './models/userModel.js';
import { uploadBase64ToCloudinary, uploadBase64ToCloudinaryAuto } from './utils/cloudinaryHelper.js';

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
      try {
        if (!userId) {
          callback?.({ ok: false, error: 'Not authenticated.' });
          return;
        }
        const { receiverId, text, tempId, attachment } = payload || {};
        if (!receiverId) {
          callback?.({ ok: false, error: 'Missing receiver.' });
          return;
        }

        const receiver = await User.findById(receiverId).select('isDisabled');
        if (!receiver) {
          callback?.({ ok: false, error: 'User not found.' });
          return;
        }
        if (receiver.isDisabled) {
          callback?.({ ok: false, error: 'User is disabled.' });
          return;
        }

        let finalImageUrl = null;
        let attachmentUrl = null;
        let attachmentType = null;
        let attachmentName = null;

        if (attachment?.data && attachment?.type) {
          if (attachment.type.startsWith('image/')) {
            finalImageUrl = await uploadBase64ToCloudinary(attachment.data, 'tribe_messages');
          } else {
            attachmentUrl = await uploadBase64ToCloudinaryAuto(attachment.data, 'tribe_message_files');
          }
          attachmentType = attachment.type;
          attachmentName = attachment.name || null;
        }

        const messageText = text || '';
        if (!messageText && !finalImageUrl && !attachmentUrl) {
          callback?.({ ok: false, error: 'Message cannot be empty.' });
          return;
        }

        const newMessage = new Message({
          sender: userId,
          receiver: receiverId,
          message: messageText,
          imageUrl: finalImageUrl,
          attachmentUrl,
          attachmentType,
          attachmentName
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
      try {
        if (!userId) {
          callback?.({ ok: false, error: 'Not authenticated.' });
          return;
        }
        const { tribeId, text, tempId, attachment } = payload || {};
        if (!tribeId) {
          callback?.({ ok: false, error: 'Missing tribe.' });
          return;
        }
        const tribe = await Tribe.findById(tribeId);
        if (!tribe) {
          callback?.({ ok: false, error: 'Tribe not found.' });
          return;
        }
        const isMember = tribe.members.some((id) => id.toString() === userId.toString());
        if (!isMember) {
          callback?.({ ok: false, error: 'Must be a member.' });
          return;
        }

        let finalImageUrl = null;
        let attachmentUrl = null;
        let attachmentType = null;
        let attachmentName = null;

        if (attachment?.data && attachment?.type) {
          if (attachment.type.startsWith('image/')) {
            finalImageUrl = await uploadBase64ToCloudinary(attachment.data, 'tribe_messages');
          } else {
            attachmentUrl = await uploadBase64ToCloudinaryAuto(attachment.data, 'tribe_message_files');
          }
          attachmentType = attachment.type;
          attachmentName = attachment.name || null;
        }

        const messageText = text || '';
        if (!messageText && !finalImageUrl && !attachmentUrl) {
          callback?.({ ok: false, error: 'Message cannot be empty.' });
          return;
        }

        const message = await TribeMessage.create({
          tribe: tribe._id,
          sender: userId,
          text: messageText,
          imageUrl: finalImageUrl,
          attachmentUrl,
          attachmentType,
          attachmentName
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
          timestamp: populated.createdAt
        };

        io.to(tribe._id.toString()).emit('newTribeMessage', responseMessage);
        tribe.members.forEach((memberId) => {
          const mId = memberId.toString();
          if (mId !== userId.toString()) {
            io.to(`user-${mId}`).emit('tribeUnread', {
              tribeId: tribe._id.toString()
            });
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
