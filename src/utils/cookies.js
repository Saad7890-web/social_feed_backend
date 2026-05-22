import { env } from "../config/env.js";

export function getSessionCookieOptions() {
  const secure = env.NODE_ENV === "production" || env.COOKIE_SECURE;

  const options = {
    httpOnly: true,
    secure,
    sameSite: env.COOKIE_SAMESITE,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 30
  };

  if (env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN;
  }

  return options;
}