import {
    getCommentLikeSummary,
    getPostLikeSummary,
    likeCommentForUser,
    likePostForUser,
    unlikeCommentForUser,
    unlikePostForUser
} from "../../repositories/like.repository.js";
import { AppError } from "../../utils/AppError.js";

export async function likePost(userId, postId, previewLimit = 3) {
  const ok = await likePostForUser(userId, postId);

  if (!ok) {
    throw new AppError("Post not found", 404, "NOT_FOUND");
  }

  return getPostLikeSummary(postId, userId, previewLimit);
}

export async function unlikePost(userId, postId, previewLimit = 3) {
  const ok = await unlikePostForUser(userId, postId);

  if (!ok) {
    throw new AppError("Post not found", 404, "NOT_FOUND");
  }

  return getPostLikeSummary(postId, userId, previewLimit);
}

export async function likeComment(userId, commentId, previewLimit = 3) {
  const ok = await likeCommentForUser(userId, commentId);

  if (!ok) {
    throw new AppError("Comment not found", 404, "NOT_FOUND");
  }

  return getCommentLikeSummary(commentId, userId, previewLimit);
}

export async function unlikeComment(userId, commentId, previewLimit = 3) {
  const ok = await unlikeCommentForUser(userId, commentId);

  if (!ok) {
    throw new AppError("Comment not found", 404, "NOT_FOUND");
  }

  return getCommentLikeSummary(commentId, userId, previewLimit);
}

export async function getPostLikes(userId, postId, previewLimit = 3) {
  const summary = await getPostLikeSummary(postId, userId, previewLimit);

  if (!summary) {
    throw new AppError("Post not found", 404, "NOT_FOUND");
  }

  return summary;
}

export async function getCommentLikes(userId, commentId, previewLimit = 3) {
  const summary = await getCommentLikeSummary(commentId, userId, previewLimit);

  if (!summary) {
    throw new AppError("Comment not found", 404, "NOT_FOUND");
  }

  return summary;
}