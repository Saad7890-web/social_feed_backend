import { Router } from "express";
import { checkDbHealth } from "../db/health.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { success } from "../utils/response.js";

const router = Router();

router.get(
  "/health",
  asyncHandler(async (req, res) => {
    const dbOk = await checkDbHealth();

    return success(res, {
      status: "ok",
      db: dbOk
    });
  })
);

export default router;