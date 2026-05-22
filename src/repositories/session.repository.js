import { query } from "../db/pool.js";

export async function createSession(client, { userId, sessionTokenHash, expiresAt }) {
  const result = await client.query(
    `INSERT INTO sessions (user_id, session_token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, expires_at, created_at`,
    [userId, sessionTokenHash, expiresAt]
  );

  return result.rows[0];
}

export async function findSessionByTokenHash(tokenHash) {
  const result = await query(
    `SELECT s.id, s.user_id, s.expires_at, s.revoked_at,
            u.first_name, u.last_name, u.email, u.created_at AS user_created_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.session_token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  return result.rows[0] || null;
}

export async function revokeSessionByTokenHash(client, tokenHash) {
  await client.query(
    `UPDATE sessions
     SET revoked_at = NOW()
     WHERE session_token_hash = $1
       AND revoked_at IS NULL`,
    [tokenHash]
  );
}