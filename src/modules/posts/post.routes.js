import { Router } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { requireAuth } from "../../middlewares/authorization.js";
import { writeRateLimit } from "../../middlewares/redisRateLimit.js";
import { create, getById, listFeed, remove, update } from "./post.controller.js";


const router = Router();

router.get("/feed", requireAuth, asyncHandler(listFeed));
router.get("/:id", requireAuth, asyncHandler(getById));
router.post("/", writeRateLimit, requireAuth, asyncHandler(create));
router.patch("/:id", writeRateLimit, requireAuth, asyncHandler(update));
router.delete("/:id", writeRateLimit, requireAuth, asyncHandler(remove));

export default router;