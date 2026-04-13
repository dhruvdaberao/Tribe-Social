import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config();

let redisClient = null;

try {
  if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
    redisClient = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    });
    console.info("[Redis] Upstash Redis Client Initialized Successfully.");
  } else {
    console.warn("[Redis] Warning: REDIS_URL or REDIS_TOKEN is missing. Redis caching will be disabled.");
  }
} catch (error) {
  console.error("[Redis] Failed to initialize Redis Client:", error.message);
}

export const redis = redisClient;
