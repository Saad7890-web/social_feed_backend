import { serializeUserPublic } from "./serializers.js";

export function serializePost(row, likeSummary = null, imageUrl = null) {
  if (!row) return null;

  return {
    id: Number(row.id),
    authorId: Number(row.author_id),
    author: row.author_id
      ? serializeUserPublic({
          id: row.author_id,
          first_name: row.author_first_name,
          last_name: row.author_last_name,
          created_at: row.author_created_at
        })
      : null,
    body: row.body,
    imageKey: row.image_key,
    imageDeliveryType: row.image_delivery_type,
    imageVersion: row.image_version ? Number(row.image_version) : null,
    imageUrl,
    visibility: row.visibility,
    likeCount: Number(likeSummary?.likeCount ?? row.like_count ?? 0),
    commentCount: Number(row.comment_count ?? 0),
    likedByMe: Boolean(likeSummary?.likedByMe ?? row.liked_by_me ?? false),
    likersPreview: likeSummary?.likersPreview ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}