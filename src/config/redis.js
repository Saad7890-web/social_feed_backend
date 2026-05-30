import { RateLimiterRedis } from "rate-limiter-flexible";
import { env } from "../config/env.js";
import { getRedisClient, getRedisStatus } from "../config/redis.js";

const limiters = new Map();

function getLimiter(prefix, points, duration) {
  const cacheKey = `${prefix}:${points}:${duration}`;
  const cached = limiters.get(cacheKey);
  if (cached) return cached;

  const redis = getRedisClient();
  if (!redis) return null;

  const limiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: prefix,
    points,
    duration,
    inmemoryBlockOnConsumed: points + 1,
    insuranceLimiter: undefined
  });

  limiters.set(cacheKey, limiter);
  return limiter;
}

function rateLimitUnavailableResponse() {
  return {
    success: false,
    error: {
      code: "RATE_LIMITER_UNAVAILABLE",
      message: "Service temporarily unavailable. Please try again later."
    }
  };
}

export function createRateLimiter({ prefix, points, duration }) {
  return async function rateLimitMiddleware(req, res, next) {
    const { ready } = getRedisStatus();
    const limiter = getLimiter(prefix, points, duration);


    if (!limiter || !ready) {
      return res.status(503).json(rateLimitUnavailableResponse());
    }

    const forwardedFor = req.headers["x-forwarded-for"];
    const clientIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : String(forwardedFor || req.ip || "anonymous").split(",")[0].trim();

    try {
      await limiter.consume(clientIp);
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
  duration: 15 * 60
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