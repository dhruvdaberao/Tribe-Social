
# Scaling Guide for Tribe Social

This document outlines the architectural changes made to support scaling and performance.

## 1. Database Optimization
- **Pagination**: We moved from `limit(10)` to cursor-based pagination (`createdAt < lastCreatedAt`). This ensures stable performance even with millions of posts.
- **Lean Queries**: We use `.lean()` in Mongoose to bypass the heavy hydration step for read-only data, reducing memory usage by ~50%.
- **Projection**: We select only necessary fields (`name`, `username`, `avatarUrl`) for populated users, preventing massive user objects from bloating the feed.

## 2. Frontend Caching
- **Safe Storage**: The `safeStorage.ts` utility wraps `sessionStorage`. It prevents the "White Screen of Death" by catching `QuotaExceededError` and evicting old cache keys (`tribe_cache_*`) if space is needed.
- **Lazy Loading**: Images use native `loading="lazy"` attributes.

## 3. Real-Time Layer
- **Echo Prevention**: The socket client now strictly ignores messages sent by the current user ID, relying on Optimistic UI for immediate feedback.
- **Population**: The backend ensures all socket messages carry fully populated sender details to avoid client-side "Unknown User" glitches.

## 4. Future Roadmap
- **Image CDN**: Run `npm run migrate:images` to move Base64 strings to Cloudinary (requires setup).
- **Redis Adapter**: For multiple backend instances, enable the Redis Adapter for Socket.IO in `socketManager.js`.
- **Service Worker**: Implement a service worker for true offline capabilities (caching assets).
