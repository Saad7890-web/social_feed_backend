
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
import { verifyCloudinaryUploadResult } from "../uploads/upload.service.js";

function normalizeImage(image, visibility) {
  if (!image) return null;

  verifyCloudinaryUploadResult(image);

  const expectedDeliveryType = visibility === "private" ? "authenticated" : "upload";

  if (image.deliveryType !== expectedDeliveryType) {
    throw new AppError("Invalid image upload", 400, "INVALID_IMAGE_UPLOAD");
  }

  return {
    imageKey: image.publicId,
    imageDeliveryType: image.deliveryType,
    imageVersion: image.version,
    imageWidth: image.width ?? null,
    imageHeight: image.height ?? null,
    imageFormat: image.format ?? null,
    imageBytes: image.bytes ?? null
  };
}

export async function createNewPost(userId, input) {
  const image = normalizeImage(input.image, input.visibility);

  return withTransaction(async (client) => {
    const post = await createPost(client, {
      authorId: userId,
      body: input.body,
      visibility: input.visibility,
      ...(image ?? {})
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

    const nextVisibility = input.visibility ?? existing.visibility;
    const image = normalizeImage(input.image, nextVisibility);

    const updated = await updatePost(client, postId, {
      body: input.body,
      visibility: input.visibility,
      ...(image ?? {})
    });

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