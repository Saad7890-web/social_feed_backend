import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/AppError.js";

function normalizeError(err) {
  if (err?.code === "23505") {
    return new AppError("Unable to complete the request.", 400, "CONFLICT");
  }

  if (err?.code === "23503") {
    return new AppError("Unable to complete the request.", 400, "INVALID_REFERENCE");
  }

  return err;
}

export function errorHandler(err, req, res, next) {
  const normalized = normalizeError(err);
  const statusCode = normalized.statusCode || 500;
  const code = normalized.code || "INTERNAL_SERVER_ERROR";
  const message = normalized.message || "Something went wrong";

  if (!(normalized instanceof AppError)) {
    logger.error({ err: normalized }, "Unhandled error");
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message:
        env.NODE_ENV === "production" && statusCode === 500
          ? "Internal server error"
          : message
    }
  });
}