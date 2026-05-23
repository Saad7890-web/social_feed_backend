import { query, withTransaction } from "../db/pool.js";

async function ensurePostAccessible(client, postId, userId) {
  const result = await client.query(
    `SELECT id, author_id, visibility
     FROM posts
     WHERE id = $1
       AND (visibility = 'public' OR author_id = $2)
     LIMIT 1`,
    [postId, userId]
  );

  return result.rows[0] || null;
}

async function ensureCommentAccessible(client, commentId, userId) {
  const result = await client.query(
    `SELECT c.id, c.post_id, c.author_id, p.author_id AS post_author_id, p.visibility
     FROM comments c
     JOIN posts p ON p.id = c.post_id
     WHERE c.id = $1
       AND (p.visibility = 'public' OR p.author_id = $2)
     LIMIT 1`,
    [commentId, userId]
  );

  return result.rows[0] || null;
}

async function insertPostLike(client, postId, userId) {
  await client.query(
    `INSERT INTO post_likes (post_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [postId, userId]
  );

  await client.query(
    `UPDATE posts
     SET like_count = (
       SELECT COUNT(*)::int
       FROM post_likes
       WHERE post_id = $1
     )
     WHERE id = $1`,
    [postId]
  );
}

async function deletePostLike(client, postId, userId) {
  await client.query(
    `DELETE FROM post_likes
     WHERE post_id = $1 AND user_id = $2`,
    [postId, userId]
  );

  await client.query(
    `UPDATE posts
     SET like_count = GREATEST((
       SELECT COUNT(*)::int
       FROM post_likes
       WHERE post_id = $1
     ), 0)
     WHERE id = $1`,
    [postId]
  );
}

async function insertCommentLike(client, commentId, userId) {
  await client.query(
    `INSERT INTO comment_likes (comment_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [commentId, userId]
  );

  await client.query(
    `UPDATE comments
     SET like_count = (
       SELECT COUNT(*)::int
       FROM comment_likes
       WHERE comment_id = $1
     )
     WHERE id = $1`,
    [commentId]
  );
}

async function deleteCommentLike(client, commentId, userId) {
  await client.query(
    `DELETE FROM comment_likes
     WHERE comment_id = $1 AND user_id = $2`,
    [commentId, userId]
  );

  await client.query(
    `UPDATE comments
     SET like_count = GREATEST((
       SELECT COUNT(*)::int
       FROM comment_likes
       WHERE comment_id = $1
     ), 0)
     WHERE id = $1`,
    [commentId]
  );
}

function buildLikeSummaryRowsSql(tableName, targetColumn, entityTableName) {
  return `
    WITH target_entities AS (
      SELECT UNNEST($1::bigint[]) AS entity_id
    )
    SELECT
      te.entity_id,
      COALESCE(e.like_count, 0)::int AS like_count,
      EXISTS (
        SELECT 1
        FROM ${tableName} lk
        WHERE lk.${targetColumn} = te.entity_id
          AND lk.user_id = $2
      ) AS liked_by_me,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id', s.user_id,
            'firstName', s.first_name,
            'lastName', s.last_name,
            'createdAt', s.user_created_at
          )
          ORDER BY s.created_at DESC
        )
        FROM (
          SELECT
            lk.user_id,
            lk.created_at,
            u.first_name,
            u.last_name,
            u.created_at AS user_created_at
          FROM ${tableName} lk
          JOIN users u ON u.id = lk.user_id
          WHERE lk.${targetColumn} = te.entity_id
          ORDER BY lk.created_at DESC
          LIMIT $3
        ) s
      ), '[]'::json) AS likers_preview
    FROM target_entities te
    LEFT JOIN ${entityTableName} e ON e.id = te.entity_id
  `;
}

export async function likePostForUser(userId, postId) {
  return withTransaction(async (client) => {
    const target = await ensurePostAccessible(client, postId, userId);
    if (!target) return null;

    await insertPostLike(client, postId, userId);
    return true;
  });
}

export async function unlikePostForUser(userId, postId) {
  return withTransaction(async (client) => {
    const target = await ensurePostAccessible(client, postId, userId);
    if (!target) return null;

    await deletePostLike(client, postId, userId);
    return true;
  });
}

export async function likeCommentForUser(userId, commentId) {
  return withTransaction(async (client) => {
    const target = await ensureCommentAccessible(client, commentId, userId);
    if (!target) return null;

    await insertCommentLike(client, commentId, userId);
    return true;
  });
}

export async function unlikeCommentForUser(userId, commentId) {
  return withTransaction(async (client) => {
    const target = await ensureCommentAccessible(client, commentId, userId);
    if (!target) return null;

    await deleteCommentLike(client, commentId, userId);
    return true;
  });
}

export async function getPostLikeSummary(postId, userId, previewLimit = 3) {
  const result = await query(
    `
    SELECT
      p.id,
      p.like_count::int AS like_count,
      EXISTS (
        SELECT 1
        FROM post_likes pl
        WHERE pl.post_id = p.id
          AND pl.user_id = $2
      ) AS liked_by_me,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id', s.user_id,
            'firstName', s.first_name,
            'lastName', s.last_name,
            'createdAt', s.user_created_at
          )
          ORDER BY s.created_at DESC
        )
        FROM (
          SELECT
            pl.user_id,
            pl.created_at,
            u.first_name,
            u.last_name,
            u.created_at AS user_created_at
          FROM post_likes pl
          JOIN users u ON u.id = pl.user_id
          WHERE pl.post_id = p.id
          ORDER BY pl.created_at DESC
          LIMIT $3
        ) s
      ), '[]'::json) AS likers_preview
    FROM posts p
    WHERE p.id = $1
      AND (p.visibility = 'public' OR p.author_id = $2)
    LIMIT 1
    `,
    [postId, userId, previewLimit]
  );

  return result.rows[0] || null;
}

export async function getCommentLikeSummary(commentId, userId, previewLimit = 3) {
  const result = await query(
    `
    SELECT
      c.id,
      c.like_count::int AS like_count,
      EXISTS (
        SELECT 1
        FROM comment_likes cl
        WHERE cl.comment_id = c.id
          AND cl.user_id = $2
      ) AS liked_by_me,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id', s.user_id,
            'firstName', s.first_name,
            'lastName', s.last_name,
            'createdAt', s.user_created_at
          )
          ORDER BY s.created_at DESC
        )
        FROM (
          SELECT
            cl.user_id,
            cl.created_at,
            u.first_name,
            u.last_name,
            u.created_at AS user_created_at
          FROM comment_likes cl
          JOIN users u ON u.id = cl.user_id
          WHERE cl.comment_id = c.id
          ORDER BY cl.created_at DESC
          LIMIT $3
        ) s
      ), '[]'::json) AS likers_preview
    FROM comments c
    JOIN posts p ON p.id = c.post_id
    WHERE c.id = $1
      AND (p.visibility = 'public' OR p.author_id = $2)
    LIMIT 1
    `,
    [commentId, userId, previewLimit]
  );

  return result.rows[0] || null;
}

export async function getPostLikeSummaries(postIds, userId, previewLimit = 3) {
  if (!Array.isArray(postIds) || postIds.length === 0) return [];

  const result = await query(
    `
    WITH target_entities AS (
      SELECT UNNEST($1::bigint[]) AS entity_id
    )
    SELECT
      te.entity_id,
      COALESCE(p.like_count, 0)::int AS like_count,
      EXISTS (
        SELECT 1
        FROM post_likes lk
        WHERE lk.post_id = te.entity_id
          AND lk.user_id = $2
      ) AS liked_by_me,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id', s.user_id,
            'firstName', s.first_name,
            'lastName', s.last_name,
            'createdAt', s.user_created_at
          )
          ORDER BY s.created_at DESC
        )
        FROM (
          SELECT
            lk.user_id,
            lk.created_at,
            u.first_name,
            u.last_name,
            u.created_at AS user_created_at
          FROM post_likes lk
          JOIN users u ON u.id = lk.user_id
          WHERE lk.post_id = te.entity_id
          ORDER BY lk.created_at DESC
          LIMIT $3
        ) s
      ), '[]'::json) AS likers_preview
    FROM target_entities te
    LEFT JOIN posts p ON p.id = te.entity_id
    WHERE p.id IS NOT NULL
      AND (p.visibility = 'public' OR p.author_id = $2)
    `,
    [postIds, userId, previewLimit]
  );

  return result.rows;
}

export async function getCommentLikeSummaries(commentIds, userId, previewLimit = 3) {
  if (!Array.isArray(commentIds) || commentIds.length === 0) return [];

  const result = await query(
    `
    WITH target_entities AS (
      SELECT UNNEST($1::bigint[]) AS entity_id
    )
    SELECT
      te.entity_id,
      COALESCE(c.like_count, 0)::int AS like_count,
      EXISTS (
        SELECT 1
        FROM comment_likes lk
        WHERE lk.comment_id = te.entity_id
          AND lk.user_id = $2
      ) AS liked_by_me,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id', s.user_id,
            'firstName', s.first_name,
            'lastName', s.last_name,
            'createdAt', s.user_created_at
          )
          ORDER BY s.created_at DESC
        )
        FROM (
          SELECT
            lk.user_id,
            lk.created_at,
            u.first_name,
            u.last_name,
            u.created_at AS user_created_at
          FROM comment_likes lk
          JOIN users u ON u.id = lk.user_id
          WHERE lk.comment_id = te.entity_id
          ORDER BY lk.created_at DESC
          LIMIT $3
        ) s
      ), '[]'::json) AS likers_preview
    FROM target_entities te
    LEFT JOIN comments c ON c.id = te.entity_id
    JOIN posts p ON p.id = c.post_id
    WHERE c.id IS NOT NULL
      AND (p.visibility = 'public' OR p.author_id = $2)
    `,
    [commentIds, userId, previewLimit]
  );

  return result.rows;
}