TRIBE SOCIAL - INTERVIEW PREPARATION GUIDE

1. PROJECT OVERVIEW
   - Tribe is a full-stack social media application.
   - Core Features: Real-time chat, Feeds, Stories (Instagram-style), Tribes (Groups), AI Assistant (Chuk).
   - Tech Stack: MERN (MongoDB, Express, React, Node.js) + TypeScript.
   - Real-time: Socket.IO for instant messaging and notifications.
   - AI: Google Gemini API.

2. ARCHITECTURE
   - Frontend: React (Vite) hosted on Vercel. Single Page Application (SPA).
   - Backend: Node.js/Express API hosted on Render.
   - Database: MongoDB Atlas (NoSQL).
   - Auth: JWT (JSON Web Tokens).

3. KEY FEATURES DEEP DIVE

   A. REAL-TIME CHAT & NOTIFICATIONS
      - Technology: Socket.IO.
      - How it works: When a user connects, they are assigned a socket ID mapped to their User ID.
      - Rooms: 
        - 1-on-1 Chat: `dm-${sortedUserIds}`.
        - Tribe Chat: `tribe-${tribeId}`.
      - Optimistic UI: The UI updates immediately when you send a message, then syncs with the server.

   B. STORIES (WYSIWYG)
      - Design: Custom "Story Creator" using standard HTML/CSS/JS events (no heavy canvas libraries).
      - Data: Stores position (x,y %), rotation, scale, and colors in MongoDB.
      - Rendering: The Viewer applies these CSS transforms exactly as saved.

   C. FEED ALGORITHM
      - Logic: Fetches posts from the current user AND users they follow.
      - Sorting: Chronological (newest first).
      - Optimization: Uses standard `.find()` with limits and `populate` for efficient data retrieval on free-tier databases.

   D. AUTHENTICATION
      - Flow: User Login -> Server verifies -> Returns JWT -> Frontend stores in LocalStorage -> Sends JWT in 'Authorization' header for requests.
      - Security: Passwords hashed with bcryptjs.

4. CHALLENGES & SOLUTIONS
   - Challenge: Render Free Tier "Cold Starts" (50s delay).
   - Solution: Increased API timeout to 5 minutes. Added local caching (localStorage) to show data immediately while server wakes up.
   
   - Challenge: MongoDB Free Tier Limits.
   - Solution: Switched from complex `aggregate` queries to optimized `find` queries to prevent 502 errors.

   - Challenge: Real-time consistency.
   - Solution: Used Optimistic UI updates (update React state instantly) + Socket events to keep multiple tabs/users in sync.

5. API ENDPOINTS SUMMARY
   - /api/auth: Login/Register.
   - /api/posts: CRUD for posts, feed, likes, comments.
   - /api/users: Profile management, follow/block.
   - /api/stories: Story creation and feed.
   - /api/tribes: Group management and chat.
   - /api/ai: Gemini integration.

6. DEPLOYMENT
   - Frontend: Vercel (Auto-deploys from Git).
   - Backend: Render (Auto-deploys from Git).
   - DB: MongoDB Atlas Cloud.
nnn