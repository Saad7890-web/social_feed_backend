import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import pinoHttp from "pino-http";

import { corsMiddleware } from "./config/cors.js";
import { logger } from "./config/logger.js";
import { securityMiddleware } from "./config/security.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import routes from "./routes/index.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(pinoHttp({ logger }));
  app.use(securityMiddleware);
  app.use(corsMiddleware);
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());

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