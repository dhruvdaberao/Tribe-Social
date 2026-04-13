import { redis } from '../config/redis.js';

/* ──────────────────── OTP SYSTEM ──────────────────── */
export const storeOTP = async (email, hashedOtp) => {
  if (!redis) return false;
  try {
    await redis.set(`otp:${email}`, hashedOtp, { ex: 300 }); // 5 minutes 
    return true;
  } catch (err) {
    console.error('[Redis Core] OTP Store Failed:', err);
    return false;
  }
};

export const getStoredOTP = async (email) => {
  if (!redis) return null;
  try {
    return await redis.get(`otp:${email}`);
  } catch (err) {
    console.error('[Redis Core] OTP Get Failed:', err);
    return null;
  }
};

export const deleteStoredOTP = async (email) => {
  if (!redis) return;
  try {
    await redis.del(`otp:${email}`);
  } catch (err) {
    console.error('[Redis Core] OTP Delete Failed:', err);
  }
};

export const incrementOtpAttempts = async (email) => {
  if (!redis) return 0;
  try {
    return await redis.incr(`otp:attempts:${email}`);
  } catch (err) {
    console.error('[Redis Core] OTP Attempts Incr Failed:', err);
    return 0;
  }
};

export const clearOtpAttempts = async (email) => {
  if (!redis) return;
  try {
    await redis.del(`otp:attempts:${email}`);
  } catch (err) {}
};

/* ──────────────────── CHAT CACHING ──────────────────── */
const generateChatKey = (userId1, userId2) => `chat:${[userId1.toString(), userId2.toString()].sort().join('-')}`;

export const getCachedMessages = async (userId1, userId2) => {
  if (!redis) return null;
  try {
    const key = generateChatKey(userId1, userId2);
    const data = await redis.get(key);
    if (data) console.info(`[Redis] CACHE HIT: Retrieved messages for ${key}`);
    return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
  } catch (err) {
    console.error('[Redis Core] Chat Get Failed:', err);
    return null;
  }
};

export const cacheMessages = async (userId1, userId2, messages) => {
  if (!redis) return;
  try {
    const key = generateChatKey(userId1, userId2);
    await redis.set(key, JSON.stringify(messages), { ex: 60 }); // Cache for 60 seconds
    console.info(`[Redis] SECURED CACHE: Saved messages for ${key}`);
  } catch (err) {
    console.error('[Redis Core] Chat Set Failed:', err);
  }
};

export const invalidateChatCache = async (userId1, userId2) => {
  if (!redis) return;
  try {
    const key = generateChatKey(userId1, userId2);
    await redis.del(key);
    console.info(`[Redis] CACHE INVALIDATED: Flushed ${key}`);
  } catch (err) {
    console.error('[Redis Core] Chat Invalidation Failed:', err);
  }
};

/* ──────────────────── LIVE MESSAGE QUEUE ──────────────────── */
export const queueLiveMessage = async (userId1, userId2, payload) => {
  if (!redis) return;
  try {
    const key = `queue:${generateChatKey(userId1, userId2)}`;
    await redis.rpush(key, JSON.stringify(payload));
    console.info(`[Redis] QUEUE: Message appended to ${key}`);
  } catch (err) {
    console.error('[Redis Core] Queue Message Failed:', err);
  }
};

/* ──────────────────── PRESENCE SYSTEM ──────────────────── */
export const trackUserOnline = async (userId, isOnline = true) => {
  if (!redis || !userId) return;
  try {
    if (isOnline) {
      await redis.set(`online:${userId}`, '1', { ex: 60 }); // 60s Heartbeat
    } else {
      await redis.del(`online:${userId}`);
    }
  } catch (err) {
    console.error('[Redis Core] Presence Tracking Failed:', err);
  }
};

export const checkIsUserOnline = async (userId) => {
  if (!redis || !userId) return false;
  try {
    const status = await redis.get(`online:${userId}`);
    return status === '1' || status === 1;
  } catch (err) {
    console.error('[Redis Core] Online Check Failed:', err);
    return false;
  }
};

/* ──────────────────── NOTIFICATION BADGES ──────────────────── */
export const incrementBadgeCount = async (userId) => {
  if (!redis || !userId) return;
  try {
    await redis.incr(`notif:${userId}`);
  } catch (err) {
    console.error('[Redis Core] Notification Increment Failed:', err);
  }
};

export const getBadgeCount = async (userId) => {
  if (!redis || !userId) return 0;
  try {
    const count = await redis.get(`notif:${userId}`);
    return parseInt(count || '0', 10);
  } catch (err) {
    console.error('[Redis Core] Notification Fetch Failed:', err);
    return 0;
  }
};

export const clearBadgeCount = async (userId) => {
  if (!redis || !userId) return;
  try {
    await redis.set(`notif:${userId}`, 0);
  } catch (err) {
    console.error('[Redis Core] Notification Reset Failed:', err);
  }
};
