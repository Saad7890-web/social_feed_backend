import { Router } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { requireAuth } from "../../middlewares/authorization.js";
import {
    getCommentLikesHandler,
    getPostLikesHandler,
    likeCommentHandler,
    likePostHandler,
    unlikeCommentHandler,
    unlikePostHandler
} from "./like.controller.js";

const router = Router();

router.get("/posts/:postId/likes", requireAuth, asyncHandler(getPostLikesHandler));
router.post("/posts/:postId/like", requireAuth, asyncHandler(likePostHandler));
router.delete("/posts/:postId/like", requireAuth, asyncHandler(unlikePostHandler));

router.get("/comments/:commentId/likes", requireAuth, asyncHandler(getCommentLikesHandler));
router.post("/comments/:commentId/like", requireAuth, asyncHandler(likeCommentHandler));
router.delete("/comments/:commentId/like", requireAuth, asyncHandler(unlikeCommentHandler));

export default router;