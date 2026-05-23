import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import likeRoutes from "../modules/likes/like.routes.js";
import postRoutes from "../modules/posts/post.routes.js";
import uploadRoutes from "../modules/uploads/upload.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import healthRoutes from "./health.routes.js";
import securityRoutes from "./security.routes.js";


const router = Router();

router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/security", securityRoutes);
router.use("/users", userRoutes);
router.use("/uploads", uploadRoutes);
router.use("/", likeRoutes);

export default router;