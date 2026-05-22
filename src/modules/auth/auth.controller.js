import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import { getSessionCookieOptions } from "../../utils/cookies.js";
import { success } from "../../utils/response.js";
import { getCurrentUserBySessionToken, loginUser, logoutUser, registerUser } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.validators.js";

export async function register(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || "Invalid input", 400, "VALIDATION_ERROR");
    }

    const { user, rawToken } = await registerUser({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      password: parsed.data.password
    });

    res.cookie(env.COOKIE_NAME, rawToken, getSessionCookieOptions());

    return success(res, { user }, null, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || "Invalid input", 400, "VALIDATION_ERROR");
    }

    const { user, rawToken } = await loginUser({
      email: parsed.data.email,
      password: parsed.data.password
    });

    res.cookie(env.COOKIE_NAME, rawToken, getSessionCookieOptions());

    return success(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const rawToken = req.cookies?.[env.COOKIE_NAME];
    await logoutUser(rawToken);

    res.clearCookie(env.COOKIE_NAME, {
      ...getSessionCookieOptions(),
      maxAge: undefined
    });

    return success(res, { message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const rawToken = req.cookies?.[env.COOKIE_NAME];
    const user = await getCurrentUserBySessionToken(rawToken);
    return success(res, { user });
  } catch (err) {
    next(err);
  }
}