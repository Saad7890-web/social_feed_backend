import { env } from "../../config/env.js";
import { buildCacheKey, buildCursorHash, cacheDel, cacheGet, cacheSet } from "../../services/cache.service.js";

export function buildFeedCacheKey(userId, limit, cursor) {
  return buildCacheKey("feed", [userId, limit, buildCursorHash(cursor)]);
}

export function buildPostCacheKey(userId, postId) {
  return buildCacheKey("post", [userId, postId]);
}

export async function getCachedFeed(userId, limit, cursor) {
  const key = buildFeedCacheKey(userId, limit, cursor);
  return cacheGet(key);
}

export async function setCachedFeed(userId, limit, cursor, value) {
  const key = buildFeedCacheKey(userId, limit, cursor);
  return cacheSet(key, value, env.CACHE_TTL_SECONDS);
}

export async function getCachedPost(userId, postId) {
  const key = buildPostCacheKey(userId, postId);
  return cacheGet(key);
}

export async function setCachedPost(userId, postId, value) {
  const key = buildPostCacheKey(userId, postId);
  return cacheSet(key, value, env.POST_CACHE_TTL_SECONDS);
}

export async function invalidatePostCaches(postId) {
  await cacheDel(`post:*:${postId}`);
  await cacheDel("feed:*");
}