
import { query } from "../db/pool.js";

async function run(client, text, params) {
  if (client) {
    return client.query(text, params);
  }

  return query(text, params);
}

export async function findAccessiblePostById(postId, viewerId) {
  const result = await query(
    `SELECT id, author_id, visibility
     FROM posts
     WHERE id = $1
       AND (visibility = 'public' OR author_id = $2)
     LIMIT 1`,
    [postId, viewerId]
  );

  return result.rows[0] || null;
}

export async function findTopLevelCommentById(commentId, viewerId) {
  const result = await query(
    `SELECT c.id, c.post_id, c.user_id, c.parent_comment_id, c.body, c.reply_count,
            c.like_count, c.created_at, c.updated_at
     FROM comments c
     JOIN posts p ON p.id = c.post_id
     WHERE c.id = $1
       AND c.parent_comment_id IS NULL
       AND (p.visibility = 'public' OR p.author_id = $2)
     LIMIT 1`,
    [commentId, viewerId]
  );

  return result.rows[0] || null;
}

export async function findAnyCommentById(commentId) {
  const result = await query(
    `SELECT id, post_id, user_id, parent_comment_id, body, reply_count, like_count, created_at, updated_at
     FROM comments
     WHERE id = $1
     LIMIT 1`,
    [commentId]
  );

  return result.rows[0] || null;
}

export async function findCommentByIdForOwner(commentId, userId, { client = null, lock = false } = {}) {
  const result = await run(
    client,
    `SELECT c.id, c.post_id, c.user_id, c.parent_comment_id, c.body, c.reply_count,
            c.like_count, c.created_at, c.updated_at
     FROM comments c
     WHERE c.id = $1
       AND c.user_id = $2
     ${lock ? "FOR UPDATE OF c" : ""}
     LIMIT 1`,
    [commentId, userId]
  );

  return result.rows[0] || null;
}

export async function findParentCommentForReply(parentCommentId, viewerId, { client = null, lock = false } = {}) {
  const result = await run(
    client,
    `SELECT c.id, c.post_id, c.user_id, c.parent_comment_id, c.body, c.reply_count,
            c.like_count, c.created_at, c.updated_at
     FROM comments c
     JOIN posts p ON p.id = c.post_id
     WHERE c.id = $1
       AND c.parent_comment_id IS NULL
       AND (p.visibility = 'public' OR p.author_id = $2)
     ${lock ? "FOR UPDATE OF c" : ""}
     LIMIT 1`,
    [parentCommentId, viewerId]
  );

  return result.rows[0] || null;
}

export async function createComment(client, { postId, userId, body, parentCommentId = null }) {
  const result = await client.query(
    `INSERT INTO comments (post_id, user_id, parent_comment_id, body)
     VALUES ($1, $2, $3, $4)
     RETURNING id, post_id, user_id, parent_comment_id, body, reply_count, like_count, created_at, updated_at`,
    [postId, userId, parentCommentId, body]
  );

  return result.rows[0];
}

export async function incrementPostCommentCount(client, postId, delta) {
  await client.query(
    `UPDATE posts
     SET comment_count = GREATEST(comment_count + $2, 0)
     WHERE id = $1`,
    [postId, delta]
  );
}

export async function incrementReplyCount(client, commentId, delta) {
  await client.query(
    `UPDATE comments
     SET reply_count = GREATEST(reply_count + $2, 0)
     WHERE id = $1`,
    [commentId, delta]
  );
}

export async function deleteCommentById(client, commentId) {
  const result = await client.query(
    `DELETE FROM comments
     WHERE id = $1
     RETURNING id`,
    [commentId]
  );

  return result.rowCount > 0;
}

export async function countDirectReplies(commentId) {
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM comments
     WHERE parent_comment_id = $1`,
    [commentId]
  );

  return Number(result.rows[0]?.count || 0);
}

export async function listTopLevelComments({ postId, limit, cursor }) {
  const params = [postId, limit];
  let cursorClause = "";

  if (cursor) {
    params.push(cursor.createdAt, cursor.id);
    cursorClause = `AND (c.created_at, c.id) < ($3::timestamptz, $4::bigint)`;
  }

  const result = await query(
    `
    SELECT
      c.id,
      c.post_id,
      c.user_id,
      c.parent_comment_id,
      c.body,
      c.reply_count,
      c.like_count,
      c.created_at,
      c.updated_at
    FROM comments c
    WHERE c.post_id = $1
      AND c.parent_comment_id IS NULL
    ${cursorClause}
    ORDER BY c.created_at DESC, c.id DESC
    LIMIT $2
    `,
    params
  );

  return result.rows;
}

export async function listReplies({ parentCommentId, limit, cursor }) {
  const params = [parentCommentId, limit];
  let cursorClause = "";

  if (cursor) {
    params.push(cursor.createdAt, cursor.id);
    cursorClause = `AND (c.created_at, c.id) < ($3::timestamptz, $4::bigint)`;
  }

  const result = await query(
    `
    SELECT
      c.id,
      c.post_id,
      c.user_id,
      c.parent_comment_id,
      c.body,
      c.reply_count,
      c.like_count,
      c.created_at,
      c.updated_at
    FROM comments c
    WHERE c.parent_comment_id = $1
    ${cursorClause}
    ORDER BY c.created_at DESC, c.id DESC
    LIMIT $2
    `,
    params
  );

  return result.rows;
}