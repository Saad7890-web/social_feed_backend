import crypto from "crypto";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { getCsrfCookieOptions } from "../utils/cookies.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/security/csrf",
  "/health",
  "/api/health"
]);

export function issueCsrfToken(req, res) {
  const token = crypto.randomBytes(32).toString("base64url");

  res.cookie(env.CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
  res.set("Cache-Control", "no-store");

  return res.json({
    success: true,
    data: {
      csrfToken: token
    }
  });
}

export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (CSRF_EXEMPT_PATHS.has(req.path)) return next();

  const cookieToken = req.cookies?.[env.CSRF_COOKIE_NAME];
  const headerToken = req.get("x-csrf-token");

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new AppError("Invalid request. Please refresh and try again.", 403, "CSRF_FAILED"));
  }

  return next();
}