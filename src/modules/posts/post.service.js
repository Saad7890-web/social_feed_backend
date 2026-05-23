import { withTransaction } from "../../db/pool.js";
import {
    createPost,
    deletePost,
    findPostById,
    findPostByIdForOwner,
    listFeedPosts,
    updatePost
} from "../../repositories/post.repository.js";
import { AppError } from "../../utils/AppError.js";
import { encodeCursor } from "../../utils/pagination.js";
import { serializePost } from "../../utils/post-serializers.js";

export async function createNewPost(userId, input) {
  return withTransaction(async (client) => {
    const post = await createPost(client, {
      authorId: userId,
      body: input.body,
      imageKey: input.imageKey,
      visibility: input.visibility
    });

    return serializePost(post);
  });
}

export async function editPost(userId, postId, input) {
  return withTransaction(async (client) => {
    const existing = await findPostByIdForOwner(postId, userId);

    if (!existing) {
      throw new AppError("Post not found", 404, "NOT_FOUND");
    }

    const updated = await updatePost(client, postId, input);

    return serializePost(updated);
  });
}

export async function removePost(userId, postId) {
  return withTransaction(async (client) => {
    const existing = await findPostByIdForOwner(postId, userId);

    if (!existing) {
      throw new AppError("Post not found", 404, "NOT_FOUND");
    }

    await deletePost(client, postId);

    return true;
  });
}

export async function getFeed(userId, { limit, cursor }) {
  const rows = await listFeedPosts({ userId, limit, cursor });

  const posts = rows.map(serializePost);
  const nextCursor =
    posts.length === limit
      ? encodeCursor({
          createdAt: posts[posts.length - 1].createdAt,
          id: posts[posts.length - 1].id
        })
      : null;

  return {
    posts,
    nextCursor
  };
}

export async function getPostByIdForCurrentUser(userId, postId) {
  const post = await findPostById(postId);

  if (!post) {
    throw new AppError("Post not found", 404, "NOT_FOUND");
  }

  if (post.visibility === "private" && Number(post.author_id) !== Number(userId)) {
    throw new AppError("Post not found", 404, "NOT_FOUND");
  }

  return serializePost(post);
}