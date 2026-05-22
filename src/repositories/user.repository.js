import { query } from "../db/pool.js";

export async function findUserByEmail(email) {
  const result = await query(
    `SELECT id, first_name, last_name, email, password_hash, created_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );

  return result.rows[0] || null;
}

export async function findUserById(id) {
  const result = await query(
    `SELECT id, first_name, last_name, email, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
}

export async function createUser(client, { firstName, lastName, email, passwordHash }) {
  const result = await client.query(
    `INSERT INTO users (first_name, last_name, email, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, first_name, last_name, email, created_at`,
    [firstName, lastName, email, passwordHash]
  );

  return result.rows[0];
}