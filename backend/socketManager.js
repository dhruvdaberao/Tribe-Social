let onlineUsers = new Map(); // Map<userId, socketId>

// Helper to get socketId by userId
export const getSocketId = (userId) => onlineUsers.get(userId.toString());

export const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    const userId = socket.handshake.auth.userId;

    if (userId) {
      // If user was already connected with another socket, update it
      if (onlineUsers.has(userId)) {
        console.log(`ℹ️ User ${userId} reconnected / opened new tab. Updating socket.`);
      }
      onlineUsers.set(userId, socket.id);
      console.log(`✅ User ${userId} is now ONLINE (Socket: ${socket.id})`);

      // Join a personal room for specific notifications (user-scoped events)
      socket.join(`user-${userId}`);
      console.log(`👤 User ${userId} joined personal room: user-${userId}`);
    } else {
      console.warn(`⚠️ Connection attempt without userId: ${socket.id}`);
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
      console.log(`📥 ${socket.id} (User: ${userId || 'anon'}) joined room: ${roomName}`);
    });

    socket.on('leaveRoom', (roomName) => {
      if (!roomName) return;
      socket.leave(roomName);
      console.log(`📤 ${socket.id} (User: ${userId || 'anon'}) left room: ${roomName}`);
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


    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);

      // Only remove user if THIS specific socket was the one logged in
      // (Handles case where user has multiple tabs and closes one)
      if (userId && onlineUsers.get(userId) === socket.id) {
        onlineUsers.delete(userId);
        console.log(`start-offline: User ${userId} went OFFLINE.`);
        io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
      }
    });
  });

  return onlineUsers;
};