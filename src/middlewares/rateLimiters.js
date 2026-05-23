import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const genericRateLimitResponse = {
  success: false,
  error: {
    code: "RATE_LIMITED",
    message: "Too many requests. Please try again later."
  }
};

export const globalRateLimit = rateLimit({
  windowMs: env.GLOBAL_RATE_LIMIT_WINDOW_MS,
  limit: env.GLOBAL_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: genericRateLimitResponse,
  skip: (req) => req.method === "OPTIONS"
});