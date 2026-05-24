import { Router } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { requireAuth } from "../../middlewares/authorization.js";
import { writeRateLimit } from "../../middlewares/redisRateLimit.js";
import { signImageUpload, verifyImageUpload } from "./upload.controller.js";

const router = Router();

router.post("/images/sign", writeRateLimit, requireAuth, asyncHandler(signImageUpload));
router.post("/images/verify", writeRateLimit, requireAuth, asyncHandler(verifyImageUpload));

export default router;