
// import express from 'express';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import connectDB from './config/db.js';

// import authRoutes from './routes/authRoutes.js';
// import postRoutes from './routes/postRoutes.js';
// import userRoutes from './routes/userRoutes.js';
// import messageRoutes from './routes/messageRoutes.js';
// import tribeRoutes from './routes/tribeRoutes.js';
// import notificationRoutes from './routes/notificationRoutes.js';
// import aiRoutes from './routes/aiRoutes.js';
// import { initializeSocket } from './socketManager.js';

// dotenv.config();

// const startServer = async () => {
//   console.log("----------------------------------");
//   console.log("🚀 Starting Tribe Backend Server...");
  
//   try {
//     console.log("1. Attempting to connect to MongoDB...");
//     await connectDB();
//     console.log("✅ MongoDB connected successfully.");

//     const app = express();
//     const httpServer = createServer(app);

//     const allowedOrigins = [
//       'https://tribe-social.vercel.app',
//       'https://tribe-social-psi.vercel.app',
//       'https://tribe-8i1h.vercel.app',
//       'https://tribals.vercel.app',
//       'http://localhost:5173',
//       'http://localhost:3000'
//     ];

//     const corsOptions = {
//       origin: (origin, callback) => {
//         // Allow requests with no origin (like mobile apps or curl requests)
//         if (!origin || allowedOrigins.includes(origin)) {
//           callback(null, true);
//         } else {
//           console.error(`CORS Error: Origin ${origin} not allowed.`);
//           callback(new Error('Not allowed by CORS'));
//         }
//       },
//       credentials: true,
//     };
    
//     console.log("2. Configuring CORS and Express middleware...");
//     app.use(cors(corsOptions));
//     app.use(express.json({ limit: '50mb' }));
//     console.log("✅ Middleware configured.");

//     console.log("3. Initializing Socket.IO...");
//     const io = new Server(httpServer, {
//       pingTimeout: 60000,
//       cors: corsOptions,
//     });
//     app.set('io', io);
//     const onlineUsers = initializeSocket(io);
//     console.log("✅ Socket.IO initialized.");
    
//     app.use((req, res, next) => {
//       req.io = io;
//       req.onlineUsers = onlineUsers;
//       next();
//     });
    
//     console.log("4. Registering API routes...");
//     app.use('/api/auth', authRoutes);
//     app.use('/api/posts', postRoutes);
//     app.use('/api/users', userRoutes);
//     app.use('/api/messages', messageRoutes);
//     app.use('/api/tribes', tribeRoutes);
//     app.use('/api/notifications', notificationRoutes);
//     app.use('/api/ai', aiRoutes);
//     console.log("✅ API routes registered.");

//     app.get('/', (req, res) => {
//       res.send('Tribe API is running...');
//     });

//     const PORT = process.env.PORT || 5001;
//     httpServer.listen(PORT, () => {
//         console.log("----------------------------------");
//         console.log(`🎉 Server is live and listening on port ${PORT}`);
//         console.log("----------------------------------");
//     });

//   } catch (error) {
//     console.error("\n❌ FAILED TO START SERVER ❌");
//     console.error("----------------------------------");
//     console.error(error);
//     console.error("----------------------------------");
//     console.error("Server startup failed. Please check the error message above.");
//     process.exit(1);
//   }
// };

// startServer();








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
      'https://tribe-social2.vercel.app',
      'https://tribe-social.vercel.app',
      'https://tribe-social-psi.vercel.app',
      'https://tribe-8i1h.vercel.app',
      'https://tribals.vercel.app',
      'https://tribe-social2-silk.vercel.app', // Added your new frontend URL
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    const corsOptions = {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.error(`CORS Error: Origin ${origin} not allowed.`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
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
