import { Router } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { requireAuth } from "../../middlewares/authorization.js";
import { signImageUpload, verifyImageUpload } from "./upload.controller.js";

const router = Router();

router.post("/images/sign", requireAuth, asyncHandler(signImageUpload));
router.post("/images/verify", requireAuth, asyncHandler(verifyImageUpload));

export default router;