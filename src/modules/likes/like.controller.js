import { AppError } from "../../utils/AppError.js";
import { success } from "../../utils/response.js";
import {
    getCommentLikes,
    getPostLikes,
    likeComment,
    likePost,
    unlikeComment,
    unlikePost
} from "./like.service.js";
import { idParamSchema, summaryQuerySchema } from "./like.validators.js";

function parseId(params, key) {
  const parsed = idParamSchema.safeParse({ id: params[key] });
  if (!parsed.success) {
    throw new AppError("Invalid id", 400, "VALIDATION_ERROR");
  }
  return parsed.data.id;
}

function parsePreviewLimit(query) {
  const parsed = summaryQuerySchema.safeParse(query);
  if (!parsed.success) {
    throw new AppError("Invalid input", 400, "VALIDATION_ERROR");
  }
  return parsed.data.previewLimit;
}

export async function likePostHandler(req, res, next) {
  try {
    const postId = parseId(req.params, "postId");
    const previewLimit = parsePreviewLimit(req.query);
    const summary = await likePost(req.user.id, postId, previewLimit);

    return success(res, {
      entityType: "post",
      entityId: postId,
      ...summary
    });
  } catch (err) {
    next(err);
  }
}

export async function unlikePostHandler(req, res, next) {
  try {
    const postId = parseId(req.params, "postId");
    const previewLimit = parsePreviewLimit(req.query);
    const summary = await unlikePost(req.user.id, postId, previewLimit);

    return success(res, {
      entityType: "post",
      entityId: postId,
      ...summary
    });
  } catch (err) {
    next(err);
  }
}

export async function getPostLikesHandler(req, res, next) {
  try {
    const postId = parseId(req.params, "postId");
    const previewLimit = parsePreviewLimit(req.query);
    const summary = await getPostLikes(req.user.id, postId, previewLimit);

    return success(res, {
      entityType: "post",
      entityId: postId,
      ...summary
    });
  } catch (err) {
    next(err);
  }
}

export async function likeCommentHandler(req, res, next) {
  try {
    const commentId = parseId(req.params, "commentId");
    const previewLimit = parsePreviewLimit(req.query);
    const summary = await likeComment(req.user.id, commentId, previewLimit);

    return success(res, {
      entityType: "comment",
      entityId: commentId,
      ...summary
    });
  } catch (err) {
    next(err);
  }
}

export async function unlikeCommentHandler(req, res, next) {
  try {
    const commentId = parseId(req.params, "commentId");
    const previewLimit = parsePreviewLimit(req.query);
    const summary = await unlikeComment(req.user.id, commentId, previewLimit);

    return success(res, {
      entityType: "comment",
      entityId: commentId,
      ...summary
    });
  } catch (err) {
    next(err);
  }
}

export async function getCommentLikesHandler(req, res, next) {
  try {
    const commentId = parseId(req.params, "commentId");
    const previewLimit = parsePreviewLimit(req.query);
    const summary = await getCommentLikes(req.user.id, commentId, previewLimit);

    return success(res, {
      entityType: "comment",
      entityId: commentId,
      ...summary
    });
  } catch (err) {
    next(err);
  }
}