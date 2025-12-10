
# Post-Merge Checklist

## Environment Variables
Ensure your `.env` file in `/backend` includes:
```env
PORT=5001
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
API_KEY=your_gemini_key
# Optional for scaling
CLOUDINARY_URL=cloudinary://...
```

## Verification Steps

1. **Install New Dependencies**:
   ```bash
   cd backend
   npm install compression helmet express-rate-limit
   ```

2. **Start Backend**:
   ```bash
   npm run server
   ```
   *Verify logs show "Middleware configured" and "Socket.IO initialized".*

3. **Frontend Storage Check**:
   - Open browser DevTools -> Application -> Session Storage.
   - Reload the app. Verify keys like `tribe_cache_posts` exist.
   - Manually fill storage (e.g., via console) to trigger limit, reload app, and ensure it doesn't crash (check console for "Attempting cleanup..." warning).

4. **Feed Pagination**:
   - Scroll down the feed. Open Network tab.
   - Verify subsequent calls to `/api/posts/feed` include `lastCreatedAt` query param.

5. **Chat Echo Test**:
   - Open two browser windows (User A and User B).
   - User A sends a message in a Tribe.
   - Verify User A sees message instantly (Optimistic) and *does not* see a second copy appear after server response.
   - Verify User B sees message with correct Name/Avatar (not "Anonymous").

6. **Offline Mode**:
   - Disconnect internet/wifi.
   - Try to navigate or post.
   - Verify "You are offline" toast appears.
