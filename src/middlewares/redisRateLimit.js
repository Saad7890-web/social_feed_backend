import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import { env } from "../config/env.js";
import { getRedisClient, getRedisStatus } from "../config/redis.js";

const limiterCache = new Map();

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return String(forwardedFor[0]).trim();
  }

  return req.ip || req.socket?.remoteAddress || "anonymous";
}

function resolveKey(req, keyResolver) {
  const key = typeof keyResolver === "function" ? keyResolver(req) : getClientIp(req);
  return String(key || "anonymous");
}

function getRedisLimiter(prefix, points, duration) {
  const redis = getRedisClient();
  const { ready } = getRedisStatus();

  if (!redis || !ready) return null;

  const cacheKey = `${prefix}:${points}:${duration}:redis`;
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;

  const limiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: prefix,
    points,
    duration,
    inmemoryBlockOnConsumed: points + 1
  });

  limiterCache.set(cacheKey, limiter);
  return limiter;
}

function getMemoryLimiter(prefix, points, duration) {
  const cacheKey = `${prefix}:${points}:${duration}:memory`;
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;

  const limiter = new RateLimiterMemory({
    keyPrefix: `${prefix}:memory`,
    points,
    duration
  });

  limiterCache.set(cacheKey, limiter);
  return limiter;
}

export function createRateLimiter({ prefix, points, duration, keyResolver }) {
  return async function rateLimitMiddleware(req, res, next) {
    const key = resolveKey(req, keyResolver);
    const limiter = getRedisLimiter(prefix, points, duration) || getMemoryLimiter(prefix, points, duration);

    try {
      await limiter.consume(key);
      return next();
    } catch {
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again later."
        }
      });
    }
  };
}

export const authRateLimit = createRateLimiter({
  prefix: "auth",
  points: 10,
  duration: 15 * 60,
  keyResolver: (req) => {
    const ip = getClientIp(req);
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    return email ? `${ip}:${email}` : ip;
  }
});

export const writeRateLimit = createRateLimiter({
  prefix: "write",
  points: 120,
  duration: 15 * 60
});

export const globalRateLimit = createRateLimiter({
  prefix: "global",
  points: env.RATE_LIMIT_POINTS,
  duration: env.RATE_LIMIT_DURATION_SECONDS
});