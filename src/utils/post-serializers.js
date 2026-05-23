import { serializeUserPublic } from "./serializers.js";

export function serializePost(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    authorId: Number(row.author_id),
    author: row.author_id ? serializeUserPublic({
      id: row.author_id,
      first_name: row.author_first_name,
      last_name: row.author_last_name,
      created_at: row.author_created_at
    }) : null,
    body: row.body,
    imageKey: row.image_key,
    visibility: row.visibility,
    likeCount: Number(row.like_count),
    commentCount: Number(row.comment_count),
    likedByMe: Boolean(row.liked_by_me),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}