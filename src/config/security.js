import helmet from "helmet";

export const securityMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: { action: "deny" },
  referrerPolicy: { policy: "no-referrer" }
});