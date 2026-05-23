import { Router } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { requireAuth } from "../../middlewares/authorization.js";
import { me, publicUserById } from "./user.controller.js";

const router = Router();

router.get("/me", requireAuth, asyncHandler(me));
router.get("/:id", requireAuth, asyncHandler(publicUserById));

export default router;