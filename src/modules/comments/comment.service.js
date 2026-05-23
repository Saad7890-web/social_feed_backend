import { withTransaction } from "../../db/pool.js";
import {
    countDirectReplies,
    createComment,
    deleteCommentById,
    findAccessiblePostById,
    findCommentByIdForOwner,
    findParentCommentForReply,
    incrementPostCommentCount,
    incrementReplyCount,
    listReplies,
    listTopLevelComments
} from "../../repositories/comment.repository.js";
import { getCommentLikeSummaries } from "../../repositories/like.repository.js";
import { findPublicUsersByIds } from "../../repositories/user.repository.js";
import { AppError } from "../../utils/AppError.js";
import { serializeComment } from "../../utils/comment-serializers.js";
import { encodeCursor } from "../../utils/pagination.js";

function buildCursorFromLastItem(items, limit) {
  if (items.length !== limit || items.length === 0) return null;

  const last = items[items.length - 1];
  return encodeCursor({
    createdAt: last.createdAt,
    id: last.id
  });
}

function normalizeLikeSummary(row) {
  return {
    entityId: Number(row.entity_id),
    likeCount: Number(row.like_count || 0),
    likedByMe: Boolean(row.liked_by_me),
    likersPreview: Array.isArray(row.likers_preview) ? row.likers_preview : []
  };
}

async function hydrateComments(rows, viewerId) {
  if (rows.length === 0) {
    return [];
  }

  const authorIds = [...new Set(rows.map((row) => Number(row.user_id)))];
  const authors = await findPublicUsersByIds(authorIds);
  const authorMap = new Map(authors.map((user) => [Number(user.id), user]));

  const commentIds = rows.map((row) => Number(row.id));
  const likeSummaries = await getCommentLikeSummaries(commentIds, viewerId, 3);
  const likeMap = new Map(
    likeSummaries.map((row) => [Number(row.entity_id), normalizeLikeSummary(row)])
  );

  return rows.map((row) =>
    serializeComment(row, authorMap.get(Number(row.user_id)), likeMap.get(Number(row.id)) || null)
  );
}

export async function createTopLevelComment(userId, postId, body) {
  return withTransaction(async (client) => {
    const post = await findAccessiblePostById(postId, userId);
    if (!post) {
      throw new AppError("Post not found", 404, "NOT_FOUND");
    }

    const comment = await createComment(client, {
      postId,
      userId,
      body,
      parentCommentId: null
    });

    await incrementPostCommentCount(client, postId, 1);

    return comment;
  });
}

export async function createReply(userId, parentCommentId, body) {
  return withTransaction(async (client) => {
    const parent = await findParentCommentForReply(parentCommentId, userId);

    if (!parent) {
      throw new AppError("Comment not found", 404, "NOT_FOUND");
    }

    const reply = await createComment(client, {
      postId: parent.post_id,
      userId,
      body,
      parentCommentId
    });

    await incrementReplyCount(client, parentCommentId, 1);
    await incrementPostCommentCount(client, parent.post_id, 1);

    return reply;
  });
}

export async function removeComment(userId, commentId) {
  return withTransaction(async (client) => {
    const comment = await findCommentByIdForOwner(commentId, userId);

    if (!comment) {
      throw new AppError("Comment not found", 404, "NOT_FOUND");
    }

    if (comment.parent_comment_id === null) {
      const replyCount = await countDirectReplies(commentId);
      await deleteCommentById(client, commentId);
      await incrementPostCommentCount(client, comment.post_id, -(1 + replyCount));
      return true;
    }

    await deleteCommentById(client, commentId);
    await incrementReplyCount(client, comment.parent_comment_id, -1);
    await incrementPostCommentCount(client, comment.post_id, -1);

    return true;
  });
}

export async function getPostComments(userId, postId, { limit, cursor }) {
  const post = await findAccessiblePostById(postId, userId);

  if (!post) {
    throw new AppError("Post not found", 404, "NOT_FOUND");
  }

  const cursorData = cursor || null;
  const rows = await listTopLevelComments({ postId, limit, cursor: cursorData });
  const comments = await hydrateComments(rows, userId);

  return {
    comments,
    nextCursor: buildCursorFromLastItem(comments, limit)
  };
}

export async function getCommentReplies(userId, parentCommentId, { limit, cursor }) {
  const parent = await findParentCommentForReply(parentCommentId, userId);

  if (!parent) {
    throw new AppError("Comment not found", 404, "NOT_FOUND");
  }

  const cursorData = cursor || null;
  const rows = await listReplies({ parentCommentId, limit, cursor: cursorData });
  const replies = await hydrateComments(rows, userId);

  return {
    replies,
    nextCursor: buildCursorFromLastItem(replies, limit)
  };
}

export async function getCommentById(userId, commentId) {
  const comment = await findCommentByIdForOwner(commentId, userId);

  if (!comment) {
    throw new AppError("Comment not found", 404, "NOT_FOUND");
  }

  const authorRows = await findPublicUsersByIds([Number(comment.user_id)]);
  const authors = authorRows[0] || null;

  const likeSummaries = await getCommentLikeSummaries([Number(comment.id)], userId, 3);
  const likeSummary = likeSummaries[0] ? normalizeLikeSummary(likeSummaries[0]) : null;

  return serializeComment(comment, authors, likeSummary);
}