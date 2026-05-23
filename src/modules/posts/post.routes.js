import { Router } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { requireAuth } from "../../middlewares/authorization.js";
import { create, getById, listFeed, remove, update } from "./post.controller.js";

const router = Router();

router.get("/feed", requireAuth, asyncHandler(listFeed));
router.get("/:id", requireAuth, asyncHandler(getById));
router.post("/", requireAuth, asyncHandler(create));
router.patch("/:id", requireAuth, asyncHandler(update));
router.delete("/:id", requireAuth, asyncHandler(remove));

export default router;