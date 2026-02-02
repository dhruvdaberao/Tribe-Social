







import 'dotenv/config';
import express from 'express';
// import dotenv from 'dotenv'; // Loaded via side-effect above
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
import { initializeSocket } from './socketManager.js';

dotenv.config();

// CRITICAL: Fail fast if JWT_SECRET is missing
if (!process.env.JWT_SECRET) {
  console.error("❌ FATAL ERROR: JWT_SECRET is not defined in environment variables.");
  console.error("   Please set JWT_SECRET in your .env or Render dashboard.");
  process.exit(1); // Crash intentionally
}

const startServer = async () => {
  console.log("----------------------------------");
  console.log("🚀 Starting Tribe Backend Server...");

  try {
    console.log("1. Attempting to connect to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected successfully.");

    const app = express();
    const httpServer = createServer(app);

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

    console.log("2. Configuring CORS and Express middleware...");
    app.use(cors(corsOptions));
    app.use(express.json({ limit: '50mb' }));

    // Global Error Handler for JSON parsing errors
    app.use((err, req, res, next) => {
      if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON Body:', err);
        return res.status(400).send({ message: 'Invalid JSON body' });
      }
      next();
    });

    // 🔥 FIX: Serve Uploads Folder (Profile Pictures, Banners, etc.)
    const uploadsPath = path.join(process.cwd(), 'uploads');
    app.use('/uploads', express.static(uploadsPath));
    console.log(`📂 Serving static files from: ${uploadsPath}`);

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
    app.use('/api/push', pushRoutes);
    console.log("✅ API routes registered.");

    app.get('/', (req, res) => {
      res.send('Tribe API is running...');
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
    console.error("Server startup failed. Please check the error message above.");
    process.exit(1);
  }
};

startServer();