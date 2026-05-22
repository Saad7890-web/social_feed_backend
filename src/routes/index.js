import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import healthRoutes from "./health.routes.js";

const router = Router();

router.use(healthRoutes);
router.use("/auth", authRoutes);

export default router;