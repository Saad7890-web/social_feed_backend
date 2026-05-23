import { AppError } from "../../utils/AppError.js";
import { decodeCursor } from "../../utils/pagination.js";
import { success } from "../../utils/response.js";
import {
    createNewPost,
    editPost,
    getFeed,
    getPostByIdForCurrentUser,
    removePost
} from "./post.service.js";
import { createPostSchema, feedQuerySchema, updatePostSchema } from "./post.validators.js";

export async function create(req, res, next) {
  try {
    const parsed = createPostSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || "Invalid input", 400, "VALIDATION_ERROR");
    }

    const post = await createNewPost(req.user.id, parsed.data);
    return success(res, { post }, null, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const postId = Number(req.params.id);
    if (!Number.isFinite(postId)) {
      throw new AppError("Invalid post id", 400, "VALIDATION_ERROR");
    }

    const parsed = updatePostSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || "Invalid input", 400, "VALIDATION_ERROR");
    }

    const post = await editPost(req.user.id, postId, parsed.data);
    return success(res, { post });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const postId = Number(req.params.id);
    if (!Number.isFinite(postId)) {
      throw new AppError("Invalid post id", 400, "VALIDATION_ERROR");
    }

    await removePost(req.user.id, postId);
    return success(res, { message: "Post deleted successfully" });
  } catch (err) {
    next(err);
  }
}

export async function listFeed(req, res, next) {
  try {
    const parsed = feedQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || "Invalid input", 400, "VALIDATION_ERROR");
    }

    const cursor = req.query.cursor ? decodeCursor(String(req.query.cursor)) : null;
    if (req.query.cursor && !cursor) {
      throw new AppError("Invalid cursor", 400, "VALIDATION_ERROR");
    }

    const result = await getFeed(req.user.id, {
      limit: parsed.data.limit,
      cursor
    });

    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const postId = Number(req.params.id);
    if (!Number.isFinite(postId)) {
      throw new AppError("Invalid post id", 400, "VALIDATION_ERROR");
    }

    const post = await getPostByIdForCurrentUser(req.user.id, postId);
    return success(res, { post });
  } catch (err) {
    next(err);
  }
}