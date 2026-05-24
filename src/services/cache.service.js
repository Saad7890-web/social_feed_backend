import crypto from "crypto";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { getRedisClient, getRedisStatus } from "../config/redis.js";

function safeJsonParse(value) {
  if (value == null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function hashKey(input) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

async function withCacheFallback(fn, fallback) {
  try {
    const redis = getRedisClient();
    if (!redis || !getRedisStatus().ready) return fallback();
    return await fn(redis);
  } catch (err) {
    logger.warn({ err }, "Redis cache operation failed");
    return fallback();
  }
}

export function buildCacheKey(prefix, parts = []) {
  return `${prefix}:${parts.join(":")}`;
}

export function buildCursorHash(cursor) {
  if (!cursor) return "start";
  return hashKey(JSON.stringify(cursor));
}

export async function cacheGet(key) {
  return withCacheFallback(async (redis) => {
    const value = await redis.get(key);
    return safeJsonParse(value);
  }, async () => null);
}

export async function cacheSet(key, value, ttlSeconds = env.CACHE_TTL_SECONDS) {
  return withCacheFallback(async (redis) => {
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return true;
  }, async () => false);
}

export async function cacheDel(patternOrKey) {
  return withCacheFallback(async (redis) => {
    if (!patternOrKey.includes("*")) {
      await redis.del(patternOrKey);
      return true;
    }

    const keys = [];
    for await (const key of redis.scanIterator({ MATCH: patternOrKey, COUNT: 200 })) {
      keys.push(key);
    }

    if (keys.length) {
      await redis.del(keys);
    }

    return true;
  }, async () => false);
}