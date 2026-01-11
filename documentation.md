TRIBE SOCIAL - ADVANCED TECHNICAL DOCUMENTATION & SYSTEM ARCHITECTURE
====================================================================
VERSION: 2.0 (Deep Dive Edition)
DATE: 2026-01-11
TARGET AUDIENCE: Senior Engineers, System Architects, Technical Interviewers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE OF CONTENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1.  High-Level System Overview & Business Value
2.  Data Flow & Request Lifecycle (Step-by-Step)
3.  Feature Deep Dive: Architecture, Logic, & Edge Cases
    3.1 Authentication (JWT, Security, Sessions)
    3.2 The Connectivity Graph (Followers, Feed Generation)
    3.3 Posts & Content Delivery (Pagination, Optimizations)
    3.4 Real-Time Tribes (WebSockets, Rooms, Event Loop)
    3.5 Interactive Features (Likes, Comments, Notifications)
4.  System Architecture Diagram (Conceptual)
5.  Database Design & Schema Philosophy (MongoDB)
6.  Security Architecture (OWASP, Headers, Sanitization)
7.  Performance, Scalability & Bottlenecks
8.  DevOps, Deployment & Infrastructure
9.  50+ SENIOR INTERVIEW QUESTIONS & ANSWERS
    9.1 System Design
    9.2 React & Frontend
    9.3 Node.js & Backend
    9.4 Database (MongoDB)
    9.5 Security & Auth
    9.6 Behavioral & Debugging

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ HIGH-LEVEL SYSTEM OVERVIEW & BUSINESS VALUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### The Product Vision
"Tribe Social" addresses the fragmentation in modern social networking. Users are tired of "global town squares" (Twitter/X) where context is lost. They want "third places" (Tribes) - dedicated micro-communities - without losing the ability to discover new content globally.
This application is a **Hybrid Social Platform**:
1.  **Macro-Social**: Follower/Following graph, Global Feed, Discoverability.
2.  **Micro-Social**: Tribes (Groups), Real-Time Chat, Closed Contexts.

### Why This Project Stands Out (Production-Grade Qualities)
Unlike typical "Clone" tutorials, this project implements features required for real-world reliability:
-   **Resiliency**: Fallback states for 404s, Network Errors, and Empty Data.
-   **Optimized IO**: Field selection (`.select()`) on backend queries to prevent payload bloat.
-   **Concurrency Handling**: Leveraging Mongoose Versioning (`__v`) to prevent race conditions on Likes.
-   **Real-Time Synchronization**: Event-driven architecture for instant feedback loops using Socket.IO.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2️⃣ DATA FLOW & REQUEST LIFECYCLE (STEP-BY-STEP)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Understanding the "Life of a Request" is critical for debugging and architecture interviews.

### Scenario: User A sends a message in "JavaScript Tribe"
1.  **User Action**: User types "Hello World" and presses Enter.
2.  **Frontend (React)**:
    -   `TribeDetailPage.tsx` captures the input.
    -   Calls `api.sendTribeMessage(tribeId, text)`.
    -   *Optimistic Update*: (Optional) UI could append the message immediately with a "sending" state.
3.  **Network Layer**:
    -   Axios Interceptor attaches `Authorization: Bearer <token>` header.
    -   Request sent to `POST https://api.render.com/api/tribes/:id/messages`.
4.  **Load Balancer (Render)**:
    -   Terminates SSL. Forwards request to an active Node.js instance.
5.  **Backend (Express Middleware)**:
    -   `cors` middleware allows the request origin.
    -   `protect` middleware decodes the JWT, finds the user in DB, attaches `req.user`.
6.  **Controller Logic**:
    -   Validates `content` is not empty.
    -   Checks if `req.user.id` is in `tribe.members` (Authorization).
    -   Creates `TribeMessage` document in MongoDB.
7.  **Persistence (MongoDB)**:
    -   Document saved. `createdAt` timestamp generated.
8.  **Real-Time Broadcast (Socket.IO)**:
    -   Controller executes `io.to(tribeId).emit('newTribeMessage', populatedMessage)`.
    -   This bypasses the HTTP Response loop and pushes data to *all* active participants.
    -   Redis Adapter (if scaled) propagates this event to other server instances.
9.  **Response**:
    -   HTTP 201 Created returned to the sender.
10. **Client Update**:
    -   Sender receives 201 (confirms specific message).
    -   *All Users* (including sender) receive Socket event -> `setMessages(prev => [...prev, newMessage])`.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3️⃣ FEATURE DEEP DIVE: ARCHITECTURE, LOGIC & EDGE CASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

#### 3.1 AUTHENTICATION (JWT)
**Architecture**: Stateless Authentication.
-   **Why?**: Scaling stateful sessions (server-side sessions) requires a centralized store (Redis). JWTs are self-contained.
-   **Token Lifecycle**:
    -   **Login**: validate password (bcrypt) -> User ID + Secret -> Sign JWT -> Return to Client.
    -   **Storage**: Client stores in `localStorage`.
    -   **Request**: Client sends `Bearer <token>`.
    -   **Validation**: Server verifies signature with Secret.
-   **Edge Cases**:
    -   *Token Expiry*: User gets 401. Frontend must redirect to Login (or use Release Token rotation).
    -   *Stolen Token*: Token is valid until expiry. Mitigation: Short expiry (15m) + Refresh Tokens (HttpOnly Cookies).

#### 3.2 THE FEED (ALGORITHM & PERFORMANCE)
**Query Logic**:
-   `GET /api/posts/feed`
-   Start with `currentUser.following` array of IDs.
-   `Post.find({ user: { $in: followingIds } })`
-   `.sort({ createdAt: -1 })` (Newest first).
-   `.limit(20)` (Pagination).
**Edge Case**: "The Justin Bieber Problem" (Fan-out).
-   If a user follows 5000 people, the `$in` array is large. MongoDB handles this okay, but at 50k it slows.
-   *Solution*: "Push" model (Fan-out on Write). When a user posts, push that post ID to every follower's "Feed" implementation in Redis. (Not implemented here, but good interview answer).

#### 3.3 LIKES & CONCURRENCY (RACE CONDITIONS)
**The Logic**: Read-Modify-Write.
1.  `post = Post.findById(id)`
2.  `if (post.likes.includes(user))` -> Remove.
3.  `else` -> Push.
4.  `post.save()`
**The Edge Case: The Double Click**:
-   User clicks "Like" twice in 100ms.
-   Request A reads (Liked: false). Request B reads (Liked: false).
-   Request A adds Like. Saves. (Version 1 -> 2).
-   Request B adds Like. Saves. (Version 1 -> 2).
-   **Result**: Request B fails with `VersionError` because document version in DB is now 2, but logic was based on 1.
-   *Impact*: User sees error or no change. Data remains consistent (No duplicate likes).

#### 3.4 COMMENTS (EMBEDDED SCHEMA)
**Architecture**: Comments are an array of sub-documents inside the Post document.
-   `comments: [ { text: String, user: ObjectId } ]`
-   **Why?**: Performance. Reading a Feed with 20 posts = 20 queries. If comments were separate, that's +20 queries (or 1 massive `$lookup`). Embedding = 1 query returns everything.
-   **Trade-off**: 16MB Document Limit. If a post gets 50,000 comments, the document breaks.
-   *Solution*: Hybrid. Embed first 100 comments. Move excess to strictly referenced collection.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4️⃣ SYSTEM ARCHITECTURE DIAGRAM (CONCEPTUAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ CLIENT LAYER ]
    Browser (React)
       │    │
       │    └─── (2) Socket.IO Connection (ws://) ──────────────┐
       │                                                        │
       └──────── (1) HTTP REST API (https://) ──────────┐       │
                                                        │       │
[ CLOUD INFRASTRUCTURE ]                                │       │
                                                        ▼       ▼
    [ LOAD BALANCER / CDN ] ────────────────────────▶ [ NODE.JS CLUSTER ]
                                                          │   │
                                       ┌──────────────────┘   └──────────────────┐
                                       ▼                                         ▼
                             [ MONGODB ATLAS ]                            [ CLOUDINARY ]
                        (Users, Posts, Tribes, Chats)                    (Images, Avatars)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5️⃣ DATABASE DESIGN (MONGODB SCHEMA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### 1. User
```json
{
  "_id": "ObjectId",
  "username": "Index (Unique)",
  "email": "Index (Unique)",
  "password": "String (Bcrypt Hash)",
  "following": ["ObjectId (Ref: User)"],
  "followers": ["ObjectId (Ref: User)"]
}
```
*Note*: `following` is stored on the user document for fast Feed generation.

### 2. Post
```json
{
  "_id": "ObjectId",
  "user": "ObjectId (Ref: User)",
  "content": "String",
  "likes": ["ObjectId (Ref: User)"],
  "comments": [
    { "_id": "ObjectId", "text": "String", "user": "ObjectId (Ref: User)" }
  ]
}
```
*Note*: Optimized for Read Heavy workloads.

### 3. Tribe
```json
{
  "_id": "ObjectId",
  "name": "String",
  "members": ["ObjectId (Ref: User)"], // Index this for "My Tribes"
  "owner": "ObjectId (Ref: User)"
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6️⃣ SECURITY ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-   **XSS (Cross-Site Scripting)**: React automatically escapes content. `dangerouslySetInnerHTML` is never used.
-   **Injection**: MongoDB queries use Object mapping (BSON), preventing SQL-style string injection.
-   **Rate Limiting**: (Conceptual) Use `express-rate-limit` to block IP addresses making >100 requests/minute.
-   **Sensitive Data**: Passwords never leave the backend. `.select('-password')` is used in queries.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7️⃣ PERFORMANCE & SCALABILITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### What happens at 1 Million Users?
1.  **Database**:
    -   *Current*: Single Replica Set.
    -   *Future*: Sharding. Shard Key: `User._id`. Data is distributed across multiple machines.
2.  **App Server**:
    -   *Current*: Single Node Process.
    -   *Future*: Kubernetes Cluster. Nginx load balances traffic.
3.  **Real-Time (Socket.IO)**:
    -   *Bottle Neck*: A single server cannot hold 1M open TCP connections.
    -   *Solution*: Redis Pub/Sub. Server A receives a message. Publishes to Redis. Server B, C, D subscribe and push to their connected clients.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8️⃣ DEVOPS & DEPLOYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-   **CI/CD**: GitHub Actions can run tests (`npm test`) on PR merge.
-   **Environment Separation**:
    -   Development: Localhost, Local Mongo.
    -   Production: Render, Mongo Atlas (Cloud).
    -   *Config*: `process.env.NODE_ENV` switches logging levels (Verbose in Dev, Error-only in Prod).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9️⃣ 50+ SENIOR INTERVIEW QUESTIONS & ANSWERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🔹 SYSTEM DESIGN & ARCHITECTURE
1.  **Q: Why use MERN over PERN (Postgres)?**
    *A*: "For a social graph, the schema is volatile. Adding features like 'Reactions' or 'Nested Comments' in SQL requires expensive schema migrations. MongoDB JSON documents map 1:1 with the Frontend state."
2.  **Q: How do you handle Global State?**
    *A*: "I use React Context for Auth/Theme (low frequency updates). For high frequency (Typing indicators), I optimize with local state/signals to prevent re-renders."
3.  **Q: Describe the Data Flow when a user Joins a Tribe.**
    *A*: Client PUT request -> API Auth Check -> Controller pushes UserID to `members` array -> Saves -> Returns updated Member Count -> UI updates button text.
4.  **Q: How would you scale the Notification System?**
    *A*: "Currently, it's direct Socket emission. To scale, I would move notifications to a Message Queue (RabbitMQ/Kafka). A dedicated Notification Service workers consumes the queue and decides delivery method (Push, Email, SMS)."
5.  **Q: Explain the 'Tribe Not Found' optimization.**
    *A*: "Instead of fetching ALL tribes and filtering on client (O(n)), I implemented a direct backend route `GET /tribes/:id` (O(1) with Index)."

### 🔹 FRONTEND (REACT)
6.  **Q: What is Prop Drilling and how did you avoid it?**
    *A*: "Passing user data 5 levels down. Avoided by wrapping the app in `AuthContext`."
7.  **Q: Why use `useEffect`?**
    *A*: "To handle side effects: Fetching data on mount, subscribing to Sockets, changing document title."
8.  **Q: How do you handle Image Uploads?**
    *A*: "I convert the file to base64 (or FormData) -> Send to Backend -> Backend parses -> Uploads to Cloudinary -> Returns URL -> URL saved to MongoDB."
9.  **Q: What is the Virtual DOM?**
    *A*: "A lightweight copy of the DOM. React diffs the new V-DOM with the old one and only updates changed nodes in the real DOM."
10. **Q: How do you protect routes?**
    *A*: "A wrapper component `RequireAuth`. If `!user`, it redirects to `/login` using `Replace`."

### 🔹 BACKEND (NODE/EXPRESS)
11. **Q: What is Middleware?**
    *A*: "Functions that execute during the request-response cycle. I use them for Auth (`protect`), CORS, and Error handling."
12. **Q: What is the Event Loop?**
    *A*: "Node's mechanism for non-blocking I/O. It offloads operations (DB, File) to the system kernel and executes the callback when done."
13. **Q: Difference between `PUT` and `PATCH`?**
    *A*: "PUT replaces the resource. PATCH modifies it. I use PUT for simplicity in updating Profiles."
14. **Q: How to handle errors in Async routes?**
    *A*: "Wrap code in `try/catch`. Pass error to `next(err)` or return `res.status(500)`."
15. **Q: Explain `process.env`.**
    *A*: "It injects secrets (MONGO_URI) at runtime, keeping them out of source code."

### 🔹 DATABASE (MONGODB)
16. **Q: Embedded vs Referenced Documents?**
    *A*: "Comments are Embedded (Fast Read). Users are Referenced (Data Normalization - if a user changes avatar, it updates everywhere)."
17. **Q: What is an Index?**
    *A*: "A data structure (B-Tree) that improves lookups. I index `username` and `email` for unique login checks."
18. **Q: What happens if MongoDB goes down?**
    *A*: "Mongoose throws a connection error. The API returns 500. UI shows 'Service Unavailable'."
19. **Q: How does `_id` work?**
    *A*: "It's a 12-byte ObjectId (Timestamp + MachineID + ProcessID + Counter). It sorts roughly by creation time."
20. **Q: Explain `.populate()`.**
    *A*: "It's a Join-like operation. It replaces a Reference ID with the actual User document content."

### 🔹 REAL-TIME & WEBSOCKETS
21. **Q: Difference between HTTP and WebSocket?**
    *A*: "HTTP is half-duplex (Request-Response). WebSocket is full-duplex (Two-way persistent channel)."
22. **Q: How do you handle a user disconnecting?**
    *A*: "Socket.IO emits `disconnect`. We update the 'Online Users' map in memory."
23. **Q: What are 'Rooms' in Socket.IO?**
    *A*: "Virtual channels. `socket.join('tribe-123')`. `io.to('tribe-123').emit(...)` broadcasts only to that group."
24. **Q: Is Socket.IO secure?**
    *A*: "Only if you authenticate the handshake query using the JWT, identical to HTTP requests."
25. **Q: What happens if the internet cuts out?**
    *A*: "Socket.IO attempts to reconnect with exponential backoff. The app should queue messages (not implemented yet)."

### 🔹 SECURITY
26. **Q: How is the Password stored?**
    *A*: "`bcrypt.hash(password, 10)`. It adds a random Salt to prevent Rainbow Table attacks."
27. **Q: Why use `Bearer` schema?**
    *A*: "Standard HTTP authentication practice. Allows flexibility for different token types in future."
28. **Q: What is CORS?**
    *A*: "Browser security stopping Domain A (Malicious) from reading API responses from Domain B (Your API)."
29. **Q: How to prevent generic attacks?**
    *A*: "Helmet.js (Headers), Input Validation, Rate Limiting."
30. **Q: Is LocalStorage safe for JWT?**
    *A*: "Vulnerable to XSS. HttpOnly Cookies are safer, but harder to work with (CSRF required). Allowed trade-off for this scope."

### 🔹 SCENARIO-BASED (DEBUGGING & BEHAVIORAL)
31. **Q: A user reports the app is 'Slow'. How do you debug?**
    *A*: "Check Network Tab (TTFB). Check Server Logs (Slow DB queries?). Use React Profiler (Useless re-renders?)."
32. **Q: You pushed a bug to Prod. What now?**
    *A*: "Rollback immediately. Reproduce locally. Fix. Add a test case. Deploy fix."
33. **Q: API returns 500. Where do you look?**
    *A*: "Server terminal/logs on Render. It usually indicates an unhandled exception or DB connection failure."
34. **Q: A style is overlapping on Mobile. Fix?**
    *A*: "Check media queries in Tailwind (`md:`, `lg:`). Use Chrome DevTools Device Emulator."
35. **Q: How do you prioritize Technical Debt?**
    *A*: "If it blocks a feature or causes bugs, fix it. If it's just 'ugly code' but works, document and refactor later."

### 🔹 "WHAT IF?" (EDGE CASES)
36. **Q: What if I like a post that is deleted?**
    *A*: "API returns 404. UI should remove the post from the feed."
37. **Q: What if I send an empty message?**
    *A*: "Frontend button is disabled. Backend validator returns 400."
38. **Q: What if two users join a tribe at the same time?**
    *A*: "MongoDB `$push` is atomic. Both are added."
39. **Q: What if I edit my Tribe but leave the name blank?**
    *A*: "Backend validation rejects it. Frontend validation shows 'Name required'."
40. **Q: What if the image is too large?**
    *A*: "Cloudinary rejects it or the Nginx Body Size limit triggers (413 Payload Too Large)."

### 🔹 FUTURE ARCHITECTURE
41. **Q: How to add 'Read Receipts'?**
    *A*: "Add `readBy: [UserId]` to Message Schema. When user views, emit socket event `readMessage`. Update UI."
42. **Q: How to add Video/Voice Chat?**
    *A*: "WebRTC (Peer-to-Peer). Use Socket.IO only for signaling (handshake)."
43. **Q: Microservices?**
    *A*: "Split 'Chat', 'Auth', and 'Feed' into separate services. Communication via gRPC or RabbitMQ."
44. **Q: Search Engine?**
    *A*: "MongoDB Atlas Search (Lucene) or migrate to ElasticSearch."
45. **Q: AI Integration?**
    *A*: "Use OpenAI API. Prompt: 'Summarize this Tribe's chat'. Return summary."

### 🔹 PROJECT SPECIFIC
46. **Q: Explain the `busstop.gif` loader.**
    *A*: "A branded asset to maintain user engagement during wait times. UX > Technical."
47. **Q: Why did you optimize the User Fetch?**
    *A*: "The payload was 5MB+ causing 20s load times. Optimizing to 50KB made it instant."
48. **Q: How do you sync Tribe Chat across tabs?**
    *A*: "Both tabs listen to the same Socket ID. Both update simultaneously."
49. **Q: What was the hardest bug?**
    *A*: "The Infinite Loop in `useEffect` when fetching Tribes. Solved by fixing dependency array and backend route."
50. **Q: Why render 'Skeletons'?**
    *A*: "Reduces Perceived Latency. Prevents Layout Shift (CLS)."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END OF ADVANCED DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
