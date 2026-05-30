import { createClient } from "redis";
import { env } from "./env.js";
import { logger } from "./logger.js";

let redisClient = null;
let redisReady = false;
let connectPromise = null;

export function getRedisStatus() {
  return {
    enabled: Boolean(redisClient),
    ready: redisReady
  };
}

export async function initRedis() {
  if (!env.REDIS_URL) return null;
  if (redisClient) return redisClient;
  if (connectPromise) return connectPromise;

  redisClient = createClient({
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy(retries) {
        return Math.min(retries * 100, 3000);
      }
    }
  });

  redisClient.on("ready", () => {
    redisReady = true;
    logger.info("Redis ready");
  });

  redisClient.on("end", () => {
    redisReady = false;
    logger.warn("Redis connection ended");
  });

  redisClient.on("error", (err) => {
    redisReady = false;
    logger.error({ err }, "Redis error");
  });

  connectPromise = redisClient.connect()
    .then(() => redisClient)
    .catch((err) => {
      logger.warn({ err }, "Redis unavailable, continuing with memory fallback");
      redisClient = null;
      redisReady = false;
      connectPromise = null;
      return null;
    });

  return connectPromise;
}

export function getRedisClient() {
  return redisClient;
}

export async function closeRedis() {
  if (!redisClient) return;

  try {
    await redisClient.quit();
  } finally {
    redisClient = null;
    redisReady = false;
    connectPromise = null;
  }
}