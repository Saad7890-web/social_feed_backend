import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import healthRoutes from "./health.routes.js";
import securityRoutes from "./security.routes.js";

const router = Router();

router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use("/security", securityRoutes);
router.use("/users", userRoutes);

export default router;