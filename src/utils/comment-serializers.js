import { serializeUserPublic } from "./serializers.js";

export function serializeComment(row, author, likeSummary = null) {
  return {
    id: Number(row.id),
    postId: Number(row.post_id),
    parentCommentId: row.parent_comment_id ? Number(row.parent_comment_id) : null,
    body: row.body,
    replyCount: Number(row.reply_count || 0),
    likeCount: Number(likeSummary?.likeCount ?? row.like_count ?? 0),
    likedByMe: Boolean(likeSummary?.likedByMe ?? row.liked_by_me ?? false),
    likersPreview: likeSummary?.likersPreview ?? [],
    author: serializeUserPublic(author),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}