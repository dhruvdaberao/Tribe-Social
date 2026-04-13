import { redis } from '../config/redis.js';

export const redisRateLimiter = (maxRequests = 5, windowSeconds = 5) => {
  return async (req, res, next) => {
    if (!redis) {
      return next(); // Fallback conceptually allowing pass-through if redis crashes
    }

    try {
      const identifier = req.user ? req.user.id || req.user._id : req.ip;
      if (!identifier) return next();

      const key = `rate:${req.originalUrl}:${identifier}`;
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (count > maxRequests) {
        console.warn(`[Redis] Rate Limit Triggered: ${identifier} exceeded ${maxRequests} req / ${windowSeconds}s on ${req.originalUrl}`);
        return res.status(429).json({ 
          message: 'Too many requests, please try again in a few seconds.', 
          error: 'Rate limit exceeded' 
        });
      }

      next();
    } catch (err) {
      console.error('[Redis Core] Rate Limiter Failure:', err);
      next(); // Don't block requests completely on redis error
    }
  };
};
