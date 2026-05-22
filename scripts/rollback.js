import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function rollbackLastMigration() {
  const client = await pool.connect();

  try {
    const result = await client.query(
      "SELECT filename FROM schema_migrations ORDER BY applied_at DESC LIMIT 1"
    );

    if (result.rowCount === 0) {
      console.log("No migrations to rollback.");
      return;
    }

    const last = result.rows[0].filename;
    console.log(`Last applied migration: ${last}`);

    
    await client.query("DELETE FROM schema_migrations WHERE filename = $1", [
      last
    ]);

    console.log("Migration record removed. Apply manual schema rollback if needed.");
  } catch (err) {
    console.error("Rollback failed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

rollbackLastMigration();