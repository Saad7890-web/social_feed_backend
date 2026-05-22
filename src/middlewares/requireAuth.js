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