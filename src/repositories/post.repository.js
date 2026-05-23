import { query } from "../db/pool.js";

export async function createPost(client, { authorId, body, imageKey, visibility }) {
  const result = await client.query(
    `INSERT INTO posts (author_id, body, image_key, visibility)
     VALUES ($1, $2, $3, $4)
     RETURNING id, author_id, body, image_key, visibility, like_count, comment_count, created_at, updated_at`,
    [authorId, body, imageKey || null, visibility]
  );

  return result.rows[0];
}

export async function findPostById(id) {
  const result = await query(
    `SELECT id, author_id, body, image_key, visibility, like_count, comment_count, created_at, updated_at
     FROM posts
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
}

export async function findPostByIdForOwner(postId, userId) {
  const result = await query(
    `SELECT id, author_id, body, image_key, visibility, like_count, comment_count, created_at, updated_at
     FROM posts
     WHERE id = $1 AND author_id = $2
     LIMIT 1`,
    [postId, userId]
  );

  return result.rows[0] || null;
}

export async function updatePost(client, postId, { body, imageKey, visibility }) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (body !== undefined) {
    fields.push(`body = $${idx++}`);
    values.push(body);
  }
  if (imageKey !== undefined) {
    fields.push(`image_key = $${idx++}`);
    values.push(imageKey);
  }
  if (visibility !== undefined) {
    fields.push(`visibility = $${idx++}`);
    values.push(visibility);
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(postId);

  const result = await client.query(
    `UPDATE posts
     SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING id, author_id, body, image_key, visibility, like_count, comment_count, created_at, updated_at`,
    values
  );

  return result.rows[0] || null;
}

export async function deletePost(client, postId) {
  const result = await client.query(
    `DELETE FROM posts
     WHERE id = $1
     RETURNING id`,
    [postId]
  );

  return result.rowCount > 0;
}

export async function listFeedPosts({ userId, limit, cursor }) {
  const params = [userId, limit];
  let cursorClause = "";
  let cursorIndex = 3;

  if (cursor) {
    params.push(cursor.createdAt, cursor.id);
    cursorClause = `AND (p.created_at, p.id) < ($${cursorIndex++}::timestamptz, $${cursorIndex++}::bigint)`;
  }

  const result = await query(
    `
    SELECT
      p.id,
      p.author_id,
      p.body,
      p.image_key,
      p.visibility,
      p.like_count,
      p.comment_count,
      p.created_at,
      p.updated_at,
      u.first_name AS author_first_name,
      u.last_name AS author_last_name,
      u.created_at AS author_created_at,
      EXISTS (
        SELECT 1
        FROM post_likes pl
        WHERE pl.post_id = p.id AND pl.user_id = $1
      ) AS liked_by_me
    FROM posts p
    JOIN users u ON u.id = p.author_id
    WHERE (
      p.visibility = 'public'
      OR p.author_id = $1
    )
    ${cursorClause}
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT $2
    `,
    params
  );

  return result.rows;
}