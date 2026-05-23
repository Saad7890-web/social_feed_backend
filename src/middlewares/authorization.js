import { env } from "../config/env.js";
import { findSessionByTokenHash } from "../repositories/session.repository.js";
import { AppError } from "../utils/AppError.js";
import { hashSessionToken } from "../utils/crypto.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[env.COOKIE_NAME];

    if (!token) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const tokenHash = hashSessionToken(token);
    const session = await findSessionByTokenHash(tokenHash);

    if (!session) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    req.user = {
      id: Number(session.user_id),
      firstName: session.first_name,
      lastName: session.last_name,
      email: session.email
    };

    req.session = {
      id: Number(session.id),
      expiresAt: session.expires_at
    };

    next();
  } catch (err) {
    next(err);
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.[env.COOKIE_NAME];

    if (!token) {
      req.user = null;
      return next();
    }

    const tokenHash = hashSessionToken(token);
    const session = await findSessionByTokenHash(tokenHash);

    if (!session) {
      req.user = null;
      return next();
    }

    req.user = {
      id: Number(session.user_id),
      firstName: session.first_name,
      lastName: session.last_name,
      email: session.email
    };

    next();
  } catch {
    req.user = null;
    next();
  }
}

export function requireOwnership(getOwnerId) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    const ownerId = Number(getOwnerId(req));

    if (!Number.isFinite(ownerId) || ownerId !== req.user.id) {
      return next(new AppError("Forbidden", 403, "FORBIDDEN"));
    }

    return next();
  };
}