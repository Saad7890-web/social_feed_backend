import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1),
  FRONTEND_ORIGIN: z.string().min(1),
  COOKIE_NAME: z.string().min(1).default("sf_session"),
  COOKIE_SECURE: z.string().transform((v) => v === "true").default("false"),
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
  COOKIE_DOMAIN: z.string().optional().default(""),
  CSRF_COOKIE_NAME: z.string().min(1).default("sf_csrf"),
  GLOBAL_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  GLOBAL_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(600),

  STORAGE_BUCKET: z.string().min(1),
  STORAGE_REGION: z.string().min(1),
  STORAGE_ACCESS_KEY_ID: z.string().min(1),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
  STORAGE_ENDPOINT: z.string().url().optional().default(""),
  STORAGE_FORCE_PATH_STYLE: z.string().transform((v) => v === "true").default("false"),
  STORAGE_URL_EXPIRES_SECONDS: z.coerce.number().int().positive().default(300),
  MAX_IMAGE_SIZE_BYTES: z.coerce.number().int().positive().default(8 * 1024 * 1024),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;