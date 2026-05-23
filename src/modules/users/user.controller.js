import { success } from "../../utils/response.js";
import { getCurrentUser, getPublicUser } from "./user.service.js";

export async function me(req, res, next) {
  try {
    const user = await getCurrentUser(req.user.id);
    return success(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function publicUserById(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isFinite(userId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user id."
        }
      });
    }

    const user = await getPublicUser(userId);
    return success(res, { user });
  } catch (err) {
    next(err);
  }
}