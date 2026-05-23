import { Router } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { requireAuth } from "../../middlewares/authorization.js";
import {
    createComment,
    createReplyHandler,
    deleteComment,
    getCommentHandler,
    listComments,
    listRepliesHandler
} from "./comment.controller.js";

const router = Router();

router.get("/posts/:postId/comments", requireAuth, asyncHandler(listComments));
router.post("/posts/:postId/comments", requireAuth, asyncHandler(createComment));

router.get("/comments/:commentId/replies", requireAuth, asyncHandler(listRepliesHandler));
router.post("/comments/:commentId/replies", requireAuth, asyncHandler(createReplyHandler));

router.get("/comments/:commentId", requireAuth, asyncHandler(getCommentHandler));
router.delete("/comments/:commentId", requireAuth, asyncHandler(deleteComment));

export default router;