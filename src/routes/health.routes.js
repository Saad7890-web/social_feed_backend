import { Router } from "express";
import { getRedisStatus } from "../config/redis.js";
import { checkDbHealth } from "../db/health.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { success } from "../utils/response.js";

const router = Router();

router.get(
  "/health",
  asyncHandler(async (req, res) => {
    const dbOk = await checkDbHealth();
    const redis = getRedisStatus();

    return success(res, {
      status: "ok",
      db: dbOk,
      redis
    });
  })
);

router.get(
  "/ready",
  asyncHandler(async (req, res) => {
    const dbOk = await checkDbHealth();
    const redis = getRedisStatus();

    if (!dbOk) {
      return res.status(503).json({
        success: false,
        error: {
          code: "NOT_READY",
          message: "Service not ready"
        }
      });
    }

    return success(res, {
      ready: true,
      db: dbOk,
      redis
    });
  })
);

export default router;