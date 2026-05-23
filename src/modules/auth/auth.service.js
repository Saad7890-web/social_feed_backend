import bcrypt from "bcrypt";
import { withTransaction } from "../../db/pool.js";
import { createSession, revokeSessionByTokenHash } from "../../repositories/session.repository.js";
import { createUser, findUserByEmail, findUserById } from "../../repositories/user.repository.js";
import { AppError } from "../../utils/AppError.js";
import { createSessionToken, hashSessionToken } from "../../utils/crypto.js";
import { serializeUser } from "../../utils/serializers.js";

const SESSION_DAYS = 30;

export async function registerUser(input) {
  return withTransaction(async (client) => {
    const existingUser = await findUserByEmail(input.email);
    if (existingUser) {
      throw new AppError("Unable to complete the request.", 400, "REGISTRATION_FAILED");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await createUser(client, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash
    });

    const rawToken = createSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

    await createSession(client, {
      userId: user.id,
      sessionTokenHash: tokenHash,
      expiresAt
    });

    return { user: serializeUser(user), rawToken };
  });
}


export async function loginUser(input) {
  const user = await findUserByEmail(input.email);

  const passwordOk = user
    ? await bcrypt.compare(input.password, user.password_hash)
    : false;

  if (!user || !passwordOk) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  return withTransaction(async (client) => {
    const rawToken = createSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

    await createSession(client, {
      userId: user.id,
      sessionTokenHash: tokenHash,
      expiresAt
    });

    const safeUser = await findUserById(user.id);

    return { user: serializeUser(safeUser), rawToken };
  });
}

export async function logoutUser(rawToken) {
  if (!rawToken) return;

  const tokenHash = hashSessionToken(rawToken);

  return withTransaction(async (client) => {
    await revokeSessionByTokenHash(client, tokenHash);
  });
}

export async function getCurrentUserBySessionToken(rawToken) {
  if (!rawToken) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const tokenHash = hashSessionToken(rawToken);
  const session = await findSessionByTokenHash(tokenHash);

  if (!session) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  return {
    id: Number(session.user_id),
    firstName: session.first_name,
    lastName: session.last_name,
    email: session.email
  };
}