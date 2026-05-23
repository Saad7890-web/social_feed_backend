import { findPublicUsersByIds, findUserById } from "../../repositories/user.repository.js";
import { AppError } from "../../utils/AppError.js";
import { serializeUser, serializeUserPublic } from "../../utils/serializers.js";

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  return serializeUser(user);
}

export async function getPublicUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  return serializeUserPublic(user);
}

export async function getPublicUsers(userIds) {
  const users = await findPublicUsersByIds(userIds);
  return users.map(serializeUserPublic);
}