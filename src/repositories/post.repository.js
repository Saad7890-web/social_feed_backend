
import { query } from "../db/pool.js";

const POST_SELECT_COLUMNS = `
  id,
  author_id,
  body,
  image_key,
  image_delivery_type,
  image_version,
  image_width,
  image_height,
  image_format,
  image_bytes,
  visibility,
  like_count,
  comment_count,
  created_at,
  updated_at
`;

export async function createPost(
  client,
  {
    authorId,
    body,
    visibility,
    imageKey = null,
    imageDeliveryType = null,
    imageVersion = null,
    imageWidth = null,
    imageHeight = null,
    imageFormat = null,
    imageBytes = null
  }
) {
  const result = await client.query(
    `INSERT INTO posts (
       author_id,
       body,
       image_key,
       image_delivery_type,
       image_version,
       image_width,
       image_height,
       image_format,
       image_bytes,
       visibility
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING ${POST_SELECT_COLUMNS}`,
    [
      authorId,
      body,
      imageKey,
      imageDeliveryType,
      imageVersion,
      imageWidth,
      imageHeight,
      imageFormat,
      imageBytes,
      visibility
    ]
  );

  return result.rows[0];
}

export async function findPostById(id) {
  const result = await query(
    `SELECT ${POST_SELECT_COLUMNS}
     FROM posts
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
}

export async function findPostByIdForOwner(postId, userId) {
  const result = await query(
    `SELECT ${POST_SELECT_COLUMNS}
     FROM posts
     WHERE id = $1 AND author_id = $2
     LIMIT 1`,
    [postId, userId]
  );

  return result.rows[0] || null;
}

export async function updatePost(
  client,
  postId,
  {
    body,
    visibility,
    imageKey,
    imageDeliveryType,
    imageVersion,
    imageWidth,
    imageHeight,
    imageFormat,
    imageBytes
  }
) {
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

  if (imageDeliveryType !== undefined) {
    fields.push(`image_delivery_type = $${idx++}`);
    values.push(imageDeliveryType);
  }

  if (imageVersion !== undefined) {
    fields.push(`image_version = $${idx++}`);
    values.push(imageVersion);
  }

  if (imageWidth !== undefined) {
    fields.push(`image_width = $${idx++}`);
    values.push(imageWidth);
  }

  if (imageHeight !== undefined) {
    fields.push(`image_height = $${idx++}`);
    values.push(imageHeight);
  }

  if (imageFormat !== undefined) {
    fields.push(`image_format = $${idx++}`);
    values.push(imageFormat);
  }

  if (imageBytes !== undefined) {
    fields.push(`image_bytes = $${idx++}`);
    values.push(imageBytes);
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
     RETURNING ${POST_SELECT_COLUMNS}`,
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

  if (cursor) {
    params.push(cursor.createdAt, cursor.id);
    cursorClause = `AND (p.created_at, p.id) < ($3::timestamptz, $4::bigint)`;
  }

  const result = await query(
    `
    SELECT
      p.id,
      p.author_id,
      p.body,
      p.image_key,
      p.image_delivery_type,
      p.image_version,
      p.visibility,
      p.like_count,
      p.comment_count,
      p.created_at,
      p.updated_at,
      u.first_name AS author_first_name,
      u.last_name AS author_last_name,
      u.created_at AS author_created_at
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