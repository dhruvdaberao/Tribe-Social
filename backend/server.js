






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
// import storyRoutes from './routes/storyRoutes.js';
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

//     // Dynamic CORS configuration to allow multiple origins easily
//     const corsOptions = {
//       origin: (origin, callback) => {
//         // Allow requests with no origin (like mobile apps or curl requests)
//         if (!origin) return callback(null, true);
        
//         // Allow localhost and Vercel deployments
//         if (origin.startsWith('http://localhost') || origin.endsWith('.vercel.app')) {
//           return callback(null, true);
//         }
        
//         console.warn(`CORS Warning: Origin ${origin} not explicitly allowed, but allowing for now to prevent blocking.`);
//         callback(null, true); 
//       },
//       credentials: true,
//       methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//       allowedHeaders: ['Content-Type', 'Authorization']
//     };
    
//     console.log("2. Configuring CORS and Express middleware...");
//     app.use(cors(corsOptions));
//     app.use(express.json({ limit: '50mb' }));
    
//     // Global Error Handler for JSON parsing errors
//     app.use((err, req, res, next) => {
//       if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
//         console.error('Bad JSON Body:', err);
//         return res.status(400).send({ message: 'Invalid JSON body' });
//       }
//       next();
//     });

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
//     app.use('/api/stories', storyRoutes);
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
import compression from 'compression';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
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

    // Security & Performance Middleware
    app.use(helmet());
    app.use(compression());
    
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    });
    app.use('/api', limiter);

    // Dynamic CORS configuration to allow multiple origins easily
    const corsOptions = {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow localhost and Vercel deployments
        if (origin.startsWith('http://localhost') || origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        
        console.warn(`CORS Warning: Origin ${origin} not explicitly allowed, but allowing for now to prevent blocking.`);
        callback(null, true); 
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };
    
    console.log("2. Configuring CORS and Express middleware...");
    app.use(cors(corsOptions));
    // Limit body size to prevent huge payloads (e.g. base64 images)
    app.use(express.json({ limit: '2mb' }));
    
    // Global Error Handler for JSON parsing errors
    app.use((err, req, res, next) => {
      if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON Body:', err);
        return res.status(400).send({ message: 'Invalid JSON body' });
      }
      next();
    });

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