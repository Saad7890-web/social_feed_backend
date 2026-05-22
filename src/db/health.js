import { query } from "./pool.js";

export async function checkDbHealth() {
  const result = await query("SELECT 1 AS ok");
  return result.rows[0]?.ok === 1;
}