import { RateLimiterRedis } from "rate-limiter-flexible";
import { env } from "../config/env.js";
import { getRedisClient } from "../config/redis.js";

function getLimiter(prefix, points, duration) {
  const redis = getRedisClient();

  if (!redis) {
    return null;
  }

  return new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: prefix,
    points,
    duration,
    inmemoryBlockOnConsumed: points + 1,
    insuranceLimiter: undefined
  });
}

export function createRateLimiter({ prefix, points, duration }) {
  const limiter = getLimiter(prefix, points, duration);

  return async function rateLimitMiddleware(req, res, next) {
    if (!limiter) return next();

    const key = req.ip || req.headers["x-forwarded-for"] || "anonymous";

    try {
      await limiter.consume(String(key));
      next();
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