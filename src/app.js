import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import pinoHttp from "pino-http";

import { corsMiddleware } from "./config/cors.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { securityMiddleware } from "./config/security.js";
import { csrfProtection } from "./middlewares/csrf.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import { globalRateLimit } from "./middlewares/rateLimiters.js";
import routes from "./routes/index.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", env.NODE_ENV === "production" ? 1 : 0);
  app.disable("x-powered-by");

  app.use(pinoHttp({ logger }));
  app.use(securityMiddleware);
  app.use(corsMiddleware);
  app.use(cookieParser());
  app.use(express.json({ limit: "64kb" }));
  app.use(express.urlencoded({ extended: false, limit: "32kb" }));
  app.use(compression());
  app.use(globalRateLimit);
  app.use(csrfProtection);

  app.get("/", (req, res) => {
    res.status(200).json({
      success: true,
      message: "API is running"
    });
  });

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}