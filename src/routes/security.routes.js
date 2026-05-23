import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { issueCsrfToken } from "../middlewares/csrf.js";

const router = Router();

router.get("/csrf", asyncHandler(issueCsrfToken));

export default router;