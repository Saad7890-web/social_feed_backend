import { Router } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { authRateLimit } from "../../middlewares/redisRateLimit.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { login, logout, me, register } from "./auth.controller.js";

const router = Router();

router.post("/register", authRateLimit, asyncHandler(register));
router.post("/login", authRateLimit, asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.get("/me", requireAuth, asyncHandler(me));

export default router;