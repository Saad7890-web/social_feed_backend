import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/AppError.js";

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "Something went wrong";

  if (!(err instanceof AppError)) {
    logger.error({ err }, "Unhandled error");
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: env.NODE_ENV === "production" && statusCode === 500 ? "Internal server error" : message
    }
  });
}