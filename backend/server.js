
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import tribeRoutes from './routes/tribeRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import { initializeSocket } from './socketManager.js';

dotenv.config();

const startServer = async () => {
  console.log("----------------------------------");
  console.log("🚀 Starting Tribe Backend Server...");
  
  try {
    console.log("1. Attempting to connect to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected successfully.");

    const app = express();
    const httpServer = createServer(app);

    const allowedOrigins = [
      'https://tribe-social.vercel.app',
     
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    const corsOptions = {
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || true) { // TEMPORARY FIX: ALLOW ALL to solve CORS immediate block
          callback(null, true);
        } else {
          console.warn(`CORS Warning: Origin ${origin} not in whitelist, but allowed for debugging.`);
          callback(null, true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };
    
    console.log("2. Configuring CORS and Express middleware...");
    app.use(cors(corsOptions));
    app.use(express.json({ limit: '50mb' }));
    console.log("✅ Middleware configured.");

    console.log("3. Initializing Socket.IO...");
    const io = new Server(httpServer, {
      pingTimeout: 60000,
      cors: corsOptions,
    });
    app.set('io', io);
    const onlineUsers = initializeSocket(io);
    console.log("✅ Socket.IO initialized.");
    
    app.use((req, res, next) => {
      req.io = io;
      req.onlineUsers = onlineUsers;
      next();
    });
    
    console.log("4. Registering API routes...");
    app.use('/api/auth', authRoutes);
    app.use('/api/posts', postRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/messages', messageRoutes);
    app.use('/api/tribes', tribeRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/ai', aiRoutes);
    app.use('/api/stories', storyRoutes);
    console.log("✅ API routes registered.");

    app.get('/', (req, res) => {
      res.send('Tribe API is running...');
    });

    // Global Error Handler to prevent 502/500 Crashes
    app.use((err, req, res, next) => {
      console.error('🔥 Global Error Handler:', err.stack);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
      }
    });

    const PORT = process.env.PORT || 5001;
    httpServer.listen(PORT, () => {
        console.log("----------------------------------");
        console.log(`🎉 Server is live and listening on port ${PORT}`);
        console.log("----------------------------------");
    });

  } catch (error) {
    console.error("\n❌ FAILED TO START SERVER ❌");
    console.error("----------------------------------");
    console.error(error);
    console.error("----------------------------------");
    process.exit(1);
  }
};

startServer();
