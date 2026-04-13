







import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import tribeRoutes from './routes/tribeRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import moderationRoutes from './routes/moderationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import cronRoutes from './routes/cronRoutes.js'; // Cron
import { initializeSocket } from './socketManager.js';
import protect from './middleware/authMiddleware.js';
import User from './models/userModel.js';

dotenv.config();

// CRITICAL: Fail fast if JWT_SECRET is missing
if (!process.env.JWT_SECRET) {
  console.error("❌ FATAL ERROR: JWT_SECRET is not defined in environment variables.");
  console.error("   Please set JWT_SECRET in your .env or Render dashboard.");
  process.exit(1); // Crash intentionally
}

const startServer = async () => {
  console.info("----------------------------------");
  console.info("🚀 Starting Tribe Backend Server...");

  try {
    console.info("1. Attempting to connect to MongoDB...");
    await connectDB();
    console.info("✅ MongoDB connected successfully.");

    const app = express();
    const httpServer = createServer(app);
    app.set('trust proxy', 1);

    // Dynamic CORS configuration to allow multiple origins easily
    // Dynamic CORS configuration to allow multiple origins easily
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://tribe-social.vercel.app',
      'https://tribe-social.onrender.com', // Render Backend self-check
      'https://dhruvdaberao.vercel.app'
    ];

    const corsOptions = {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.error(`❌ CORS Error: Origin ${origin} not allowed.`);
          callback(new Error('Not allowed by CORS')); // Blocking unauthorized origins
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers']
    };

    // 2. Configuring CORS and Express middleware...
    app.use(cors(corsOptions));

    // 🔥 PER-ROUTE PAYLOAD LIMITS (Security Fix)
    // ----------------------------------------------------
    const standardPayload = express.json({ limit: '100kb' }); // For Auth, Notifications, simple text
    const largePayload = express.json({ limit: '50mb' });     // For Base64 Images (Posts, Profiles, Messages)

    // Global Error Handler for JSON parsing errors
    app.use((err, req, res, next) => {
      if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON Body:', err);
        return res.status(400).send({ message: 'Invalid JSON body' });
      }
      next();
    });

    console.info("✅ Middleware configured.");

    console.info("3. Initializing Socket.IO...");
    const io = new Server(httpServer, {
      pingTimeout: 60000,
      cors: corsOptions,
    });
    app.set('io', io);
    const onlineUsers = initializeSocket(io);
    console.info("✅ Socket.IO initialized.");

    app.use((req, res, next) => {
      req.io = io;
      req.onlineUsers = onlineUsers;
      next();
    });

    console.info("4. Registering API routes...");
    // 🔒 Strict Limits (High Security)
    app.use('/api/auth', standardPayload, authRoutes);
    // ... (existing imports)

    // ...

    app.use('/api/notifications', standardPayload, notificationRoutes);
    app.post('/api/save-token', standardPayload, protect, async (req, res) => {
      try {
        const { token } = req.body;
        if (!token || typeof token !== 'string') {
          return res.status(400).json({ message: 'Valid FCM token is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        user.fcmToken = token;
        await user.save();
        console.log('Saved token:', token);
        return res.json({ success: true });
      } catch (error) {
        console.error('Error saving FCM token:', error);
        return res.status(500).json({ message: 'Failed to save token' });
      }
    });
    app.use('/api/moderation', standardPayload, moderationRoutes); // 🔥 MODERATION ROUTES
    app.use('/api/reports', standardPayload, reportRoutes);
    app.use('/api/ai', standardPayload, aiRoutes);
    // ...
    app.use('/api/push', standardPayload, pushRoutes);
    app.use('/api/cron', standardPayload, cronRoutes); // ⏳ CRON JOBS

    // 📸 Large Limits (Content Creation)
    app.use('/api/posts', largePayload, postRoutes);
    app.use('/api/users', largePayload, userRoutes);
    app.use('/api/messages', largePayload, messageRoutes);
    app.use('/api/tribes', largePayload, tribeRoutes);
    app.use('/api/stories', largePayload, storyRoutes);

    console.info("✅ API routes registered with security limits.");

    app.get('/', (req, res) => {
      res.send('Tribe API is running...');
    });

    const PORT = process.env.PORT || 5001;
    httpServer.listen(PORT, () => {
      console.info("----------------------------------");
      console.info(`🎉 Server is live and listening on port ${PORT}`);
      console.info("----------------------------------");
    });

  } catch (error) {
    console.error("\n❌ FAILED TO START SERVER ❌");
    console.error("----------------------------------");
    console.error(error);
    console.error("----------------------------------");
    console.error("Server startup failed. Please check the error message above.");
    process.exit(1);
  }
};

startServer();
