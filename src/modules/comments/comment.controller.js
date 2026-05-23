import { AppError } from "../../utils/AppError.js";
import { decodeCursor } from "../../utils/pagination.js";
import { success } from "../../utils/response.js";
import {
    createReply,
    createTopLevelComment,
    getCommentById,
    getCommentReplies,
    getPostComments,
    removeComment
} from "./comment.service.js";
import { commentBodySchema, listQuerySchema } from "./comment.validators.js";

function parsePostId(req) {
  const postId = Number(req.params.postId);
  if (!Number.isFinite(postId)) {
    throw new AppError("Invalid post id", 400, "VALIDATION_ERROR");
  }
  return postId;
}

function parseCommentId(req, key = "commentId") {
  const commentId = Number(req.params[key]);
  if (!Number.isFinite(commentId)) {
    throw new AppError("Invalid comment id", 400, "VALIDATION_ERROR");
  }
  return commentId;
}

function parseCursor(req) {
  if (!req.query.cursor) return null;
  const cursor = decodeCursor(String(req.query.cursor));
  if (!cursor) {
    throw new AppError("Invalid cursor", 400, "VALIDATION_ERROR");
  }
  return cursor;
}

export async function createComment(req, res, next) {
  try {
    const postId = parsePostId(req);
    const parsed = commentBodySchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || "Invalid input", 400, "VALIDATION_ERROR");
    }

    const comment = await createTopLevelComment(req.user.id, postId, parsed.data.body);

    return success(res, { comment }, null, 201);
  } catch (err) {
    next(err);
  }
}

export async function createReplyHandler(req, res, next) {
  try {
    const parentCommentId = parseCommentId(req, "commentId");
    const parsed = commentBodySchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || "Invalid input", 400, "VALIDATION_ERROR");
    }

    const reply = await createReply(req.user.id, parentCommentId, parsed.data.body);

    return success(res, { reply }, null, 201);
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req, res, next) {
  try {
    const commentId = parseCommentId(req);
    await removeComment(req.user.id, commentId);
    return success(res, { message: "Comment deleted successfully" });
  } catch (err) {
    next(err);
  }
}

export async function listComments(req, res, next) {
  try {
    const postId = parsePostId(req);
    const parsed = listQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || "Invalid input", 400, "VALIDATION_ERROR");
    }

    const result = await getPostComments(req.user.id, postId, {
      limit: parsed.data.limit,
      cursor: parseCursor(req)
    });

    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function listRepliesHandler(req, res, next) {
  try {
    const commentId = parseCommentId(req, "commentId");
    const parsed = listQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || "Invalid input", 400, "VALIDATION_ERROR");
    }

    const result = await getCommentReplies(req.user.id, commentId, {
      limit: parsed.data.limit,
      cursor: parseCursor(req)
    });

    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getCommentHandler(req, res, next) {
  try {
    const commentId = parseCommentId(req, "commentId");
    const comment = await getCommentById(req.user.id, commentId);
    return success(res, { comment });
  } catch (err) {
    next(err);
  }
}