import { env } from "../config/env.js";

function isSecureCookie() {
  return env.NODE_ENV === "production" || env.COOKIE_SECURE;
}

export function getSessionCookieOptions() {
  const options = {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: env.COOKIE_SAMESITE,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 30
  };

  if (env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN;
  }

  return options;
}

export function getCsrfCookieOptions() {
  const options = {
    httpOnly: false,
    secure: isSecureCookie(),
    sameSite: env.COOKIE_SAMESITE,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 30
  };

  if (env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN;
  }

  return options;
}